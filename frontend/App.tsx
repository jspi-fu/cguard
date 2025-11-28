import React, { useState, useCallback, useEffect } from 'react';
import { LeftPanel } from './components/LeftPanel';
import { CenterPanel } from './components/CenterPanel';
import { RightPanel } from './components/RightPanel';
import { MOCK_DATA } from './mockData';
import {
  ReviewStatus,
  Language,
  ContentItem,
  SingleReviewPayload,
  BatchTemplateRow,
  ReviewLogEntry,
} from './types';
import { ToastProvider, useToast } from './components/ui/Toast';
import { translations } from './translations';
import { submitReviewRequest, resolvePhotoUrl, ReviewOutputs } from './services/review';

function Dashboard() {
  const [items, setItems] = useState<ContentItem[]>(MOCK_DATA);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, ReviewStatus>>({});
  const [language, setLanguage] = useState<Language>('zh');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [reviewLogs, setReviewLogs] = useState<ReviewLogEntry[]>([]);
  const { showToast } = useToast();

  const currentItem = items[currentIndex];

  const recordReviewOutcome = useCallback((id: string, result: string) => {
    if (!id) return;
    setReviewLogs(prev => [...prev, { id, result, timestamp: Date.now() }]);
  }, []);

  const downloadReviewCsv = useCallback(() => {
    if (!reviewLogs.length) {
      showToast(translations[language].toast.noLog, 'info');
      return;
    }
    const header = 'ID,Result,Timestamp';
    const rows = reviewLogs.map(entry => {
      const date = new Date(entry.timestamp).toISOString();
      return `"${entry.id.replace(/"/g, '""')}","${entry.result.replace(/"/g, '""')}",${date}`;
    });
    const csvContent = [header, ...rows].join('\r\n');
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const date = new Date();
    const fileName = `${date.toISOString().slice(0, 10)}_review_results.csv`;
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast(translations[language].toast.exported, 'success');
  }, [reviewLogs, language, showToast]);

  const parseOutputsToItem = useCallback(
    (outputs: ReviewOutputs, preferredId?: string): ContentItem | null => {
      const coerceString = (value: unknown) =>
        typeof value === 'string' && value.trim() ? value.trim() : undefined;

      const sanitizedText = coerceString(outputs.text);
      const contentText = coerceString(outputs.content);
      const primaryText = sanitizedText ?? contentText;
      const originalText = sanitizedText && contentText ? contentText : undefined;
      const imageUrl = resolvePhotoUrl(outputs.photo);

      if (!primaryText && !imageUrl) {
        return null;
      }

      const results = outputs.results as Record<string, unknown> | undefined;
      const harmTypesRaw = results?.['有害内容类型'];
      let harmTypes: string[] = [];

      if (Array.isArray(harmTypesRaw)) {
        harmTypes = harmTypesRaw.map((item) => String(item)).filter(Boolean);
      } else if (typeof harmTypesRaw === 'string') {
        harmTypes = harmTypesRaw
          .split(/[,，]/)
          .map((item) => item.trim())
          .filter(Boolean);
      }

      const explanation =
        (typeof results?.['原因解释'] === 'string' && results['原因解释']) ||
        (typeof results?.['explanation'] === 'string' && (results['explanation'] as string)) ||
        translations[language].right.noExplanation;

      const itemType = imageUrl && primaryText ? 'mixed' : imageUrl ? 'image' : 'text';
      const id = preferredId || `engine-${crypto.randomUUID?.() ?? Date.now().toString()}`;

      return {
        id,
        type: itemType,
        text: primaryText,
        originalText,
        imageUrl,
        source: 'engine',
        createdAt: Date.now(),
        aiPrediction: {
          riskTypes: harmTypes.length ? harmTypes : [translations[language].right.noRiskLabel],
          explanation,
          rawResults: outputs.results,
        },
      };
    },
    [language],
  );

  const insertOrReplaceItem = useCallback(
    (item: ContentItem, focusNewItem: boolean) => {
      setItems(prev => {
        const existingIndex = prev.findIndex(existing => existing.id === item.id);
        if (existingIndex >= 0) {
          const next = prev.map((existing, index) => (index === existingIndex ? item : existing));
          if (focusNewItem) {
            setCurrentIndex(existingIndex);
          }
          return next;
        }
        const next = [...prev, item];
        if (focusNewItem) {
          setCurrentIndex(next.length - 1);
        }
        return next;
      });
    },
    [],
  );

  const runWorkflowAndHandleOutputs = useCallback(
    async (payload: SingleReviewPayload, options?: { focusNewItem?: boolean }) => {
      const outputs = await submitReviewRequest(payload);

      if (!outputs) {
        throw new Error(translations[language].toast.unexpectedResponse);
      }

      const referenceId = payload.itemId || `engine-${Date.now()}`;

      const hasOnlyType =
        !!outputs.type &&
        !outputs.results &&
        !outputs.content &&
        !outputs.photo &&
        !outputs.text;

      if (hasOnlyType) {
        showToast(
          `${translations[language].toast.reviewResult} ${outputs.type}`,
          'success',
        );
        recordReviewOutcome(referenceId, outputs.type);
        return true;
      }

      const hasReviewContent =
        !!outputs.results && (outputs.content || outputs.photo || outputs.text);

      if (hasReviewContent) {
        const newItem = parseOutputsToItem(outputs, payload.itemId);
        if (!newItem) {
          throw new Error(translations[language].toast.unexpectedResponse);
        }

        insertOrReplaceItem(newItem, options?.focusNewItem ?? true);
        showToast(translations[language].toast.fetchSuccess, 'success');
        return true;
      }

      throw new Error(translations[language].toast.unhandledResponse);
    },
    [insertOrReplaceItem, language, parseOutputsToItem, recordReviewOutcome, showToast],
  );

  // Navigation Logic
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
  }, [items.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const handleJumpTo = (index: number) => {
    if (index >= 0 && index < items.length) {
      setCurrentIndex(index);
    }
  };

  // Decision Logic
  const makeDecision = useCallback((status: ReviewStatus) => {
    const item = items[currentIndex];
    if (!item) {
      return;
    }

    const itemId = item.id;
    setDecisions(prev => ({
      ...prev,
      [itemId]: status
    }));

    const t = translations[language].toast;
    const resultText = status === ReviewStatus.APPROVED ? t.safe : t.unsafe;
    const toastType = status === ReviewStatus.APPROVED ? 'success' : 'destructive';
    showToast(`${t.reviewResult} ${resultText}`, toastType);

    const logResult =
      status === ReviewStatus.APPROVED
        ? translations[language].toast.safePlain
        : translations[language].toast.unsafePlain;
    recordReviewOutcome(itemId, logResult);

    // Auto-advance after a short delay for visual feedback
    if (currentIndex < items.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 150); 
    }
  }, [currentIndex, items, language, recordReviewOutcome, showToast]);

  const handleSingleReview = useCallback(
    async (payload: SingleReviewPayload): Promise<boolean> => {
      try {
        setIsSubmitting(true);
        await runWorkflowAndHandleOutputs(
          {
            ...payload,
            itemId: payload.itemId ?? `manual-${Date.now()}`,
          },
          { focusNewItem: true },
        );
        return true;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : translations[language].toast.networkError;
        if (payload.itemId) {
          recordReviewOutcome(payload.itemId, `Error: ${message}`);
        }
        showToast(message, 'destructive');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [language, recordReviewOutcome, runWorkflowAndHandleOutputs, showToast],
  );

  const handleBatchWorkflow = useCallback(
    async (rows: BatchTemplateRow[]): Promise<void> => {
      if (!rows.length) {
        showToast(translations[language].input.emptyTemplate, 'info');
        return;
      }
      setIsBatchProcessing(true);
      let successCount = 0;
      let failureCount = 0;

      for (const row of rows) {
        const payload: SingleReviewPayload = {
          text: row.content,
          itemId: row.id,
          photoPath: row.photo,
        };

        if (!payload.text && !payload.photoPath) {
          failureCount++;
          const message = translations[language].input.validationRequired;
          showToast(`${row.id}: ${message}`, 'destructive');
          recordReviewOutcome(row.id, `Error: ${message}`);
          await new Promise((resolve) => setTimeout(resolve, 200));
          continue;
        }

        try {
          await runWorkflowAndHandleOutputs(payload, { focusNewItem: false });
          successCount++;
        } catch (error) {
          failureCount++;
          const message =
            error instanceof Error
              ? error.message
              : translations[language].toast.networkError;
          recordReviewOutcome(row.id, `Error: ${message}`);
          showToast(`${row.id}: ${message}`, 'destructive');
        }

        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      setIsBatchProcessing(false);
      const summary = translations[language].input.batchSummary
        .replace('{success}', String(successCount))
        .replace('{failed}', String(failureCount));
      showToast(summary, failureCount ? 'warning' : 'success');
    },
    [language, recordReviewOutcome, runWorkflowAndHandleOutputs, showToast],
  );

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if active element is an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
          handleNext();
          break;
        case 'ArrowLeft':
          handlePrev();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, makeDecision]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Left Panel: Input */}
      <LeftPanel 
        language={language} 
        setLanguage={setLanguage}
        onRunWorkflow={handleSingleReview}
        isRunning={isSubmitting}
        onRunBatchWorkflow={handleBatchWorkflow}
        isBatchRunning={isBatchProcessing}
        onDownloadLog={downloadReviewCsv}
        canExport={reviewLogs.length > 0}
      />

      {/* Center Panel: Core Review */}
      <CenterPanel 
        item={currentItem}
        onApprove={() => makeDecision(ReviewStatus.APPROVED)}
        onReject={() => makeDecision(ReviewStatus.REJECTED)}
        onNext={handleNext}
        onPrev={handlePrev}
        canGoNext={currentIndex < items.length - 1}
        canGoPrev={currentIndex > 0}
        language={language}
      />

      {/* Right Panel: Aux Info */}
      <RightPanel 
        items={items}
        currentIndex={currentIndex}
        decisions={decisions}
        onJumpTo={handleJumpTo}
        language={language}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  );
}