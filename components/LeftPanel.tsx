'use client'

import React, { useRef, useState } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Play,
  Download,
  Languages,
  XCircle,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { Language, SingleReviewPayload, BatchTemplateRow } from '@/lib/types';
import { translations } from '@/lib/translations';
import { useToast } from './ui/Toast';
import { parseBatchTemplate, downloadBatchTemplate } from '@/lib/utils/batchParser';

interface LeftPanelProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  onRunWorkflow: (payload: SingleReviewPayload) => Promise<boolean>;
  isRunning: boolean;
  onRunBatchWorkflow: (rows: BatchTemplateRow[]) => Promise<void>;
  isBatchRunning: boolean;
  onDownloadLog: () => void;
  canExport: boolean;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  language,
  setLanguage,
  onRunWorkflow,
  isRunning,
  onRunBatchWorkflow,
  isBatchRunning,
  onDownloadLog,
  canExport,
}) => {
  const [activeTab, setActiveTab] = useState<'batch' | 'single'>('batch');
  const [textContent, setTextContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [templateRows, setTemplateRows] = useState<BatchTemplateRow[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [templateFormat, setTemplateFormat] = useState<'csv' | 'xlsx' | 'xls'>('csv');
  const [mediaMode, setMediaMode] = useState<'file' | 'url'>('file');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const templateInputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();
  const t = translations[language].input;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setImageFile(file);
    setImageUrl('');
  };

  const handleRemoveFile = () => {
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetMedia = () => {
    handleRemoveFile();
    setImageUrl('');
    setMediaMode('file');
  };

  const mediaLocked =
    (mediaMode === 'file' && !!imageFile) || (mediaMode === 'url' && !!imageUrl.trim());

  const handleStartReview = async () => {
    const trimmedText = textContent.trim();
    const trimmedUrl = imageUrl.trim();

    if (!trimmedText && !imageFile && !trimmedUrl) {
      showToast(t.validationRequired, 'destructive');
      return;
    }

    const success = await onRunWorkflow({
      text: trimmedText || undefined,
      imageUrl: trimmedUrl || undefined,
      imageFile,
    });

    if (success) {
      setTextContent('');
      setImageUrl('');
      handleRemoveFile();
    }
  };

  const handleTemplateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const templateFile = event.target.files?.[0];
    if (!templateFile) {
      showToast(t.templateError, 'destructive');
      setTemplateRows([]);
      return;
    }

    setParsing(true);
    try {
      const rows = await parseBatchTemplate(templateFile);
      setTemplateRows(rows);
      setTemplateName(templateFile.name);
      showToast(
        t.templateParsed.replace('{count}', String(rows.length)),
        rows.length ? 'success' : 'info',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : t.templateError;
      showToast(message, 'destructive');
      setTemplateRows([]);
    } finally {
      setParsing(false);
      if (templateInputRef.current) {
        templateInputRef.current.value = '';
      }
    }
  };

  const handleBatchStart = async () => {
    if (!templateRows.length) {
      showToast(t.templateRequired, 'destructive');
      return;
    }
    await onRunBatchWorkflow(templateRows);
  };

  const renderMediaControls = () => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {t.mediaAttachment}
      </label>
      <div className="flex items-center gap-2 mb-2">
        <select
          className="flex-1 border border-slate-200 rounded-md px-2 py-1.5 text-sm"
          value={mediaMode}
          onChange={(e) => setMediaMode(e.target.value as 'file' | 'url')}
          disabled={mediaLocked}
        >
          <option value="file">{t.mediaModeUpload}</option>
          <option value="url">{t.mediaModeUrl}</option>
        </select>
        {mediaLocked && (
          <button
            type="button"
            className="text-xs text-indigo-600 hover:underline"
            onClick={resetMedia}
          >
            {t.resetMedia}
          </button>
        )}
      </div>
      <p className="text-[11px] text-slate-400 mb-2">
        {mediaLocked ? t.mediaLockedHint : t.mediaHint}
      </p>
      {mediaMode === 'file' ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            className="w-full border border-slate-200 rounded-lg p-4 flex items-center justify-center gap-2 text-slate-600 hover:bg-slate-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            type="button"
            disabled={mediaMode !== 'file'}
          >
            <ImageIcon className="w-4 h-4" />
            <span className="text-sm">{t.uploadImage}</span>
          </button>
          {imageFile && (
            <div className="mt-3 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <div>
                <p className="text-xs font-semibold text-slate-600">{t.selectedFile}</p>
                <p className="text-xs text-slate-500 truncate max-w-[140px]">{imageFile.name}</p>
              </div>
              <button
                className="text-red-500 hover:text-red-600 transition-colors"
                onClick={handleRemoveFile}
                type="button"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <input
          type="url"
          className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          placeholder={t.imageUrlPlaceholder}
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
      )}
    </div>
  );

  const exportButton = (
    <button
      className={`w-full border border-slate-200 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 transition ${
        canExport
          ? 'text-slate-700 hover:bg-white'
          : 'text-slate-400 cursor-not-allowed opacity-60'
      }`}
      onClick={onDownloadLog}
      type="button"
      disabled={!canExport}
    >
      <FileText className={`w-4 h-4 ${canExport ? 'text-indigo-600' : 'text-slate-300'}`} />
      {t.downloadLog}
    </button>
  );

  return (
    <div className="w-80 flex flex-col border-r border-slate-200 bg-white h-full shrink-0">
      {/* Tabs Header */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('batch')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'batch'
              ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          {t.batchTab}
        </button>
        <button
          onClick={() => setActiveTab('single')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'single'
              ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          {t.singleTab}
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6 flex-1 overflow-y-auto flex flex-col">
        {activeTab === 'batch' ? (
          <div className="h-full flex flex-col space-y-5">
            <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50/70">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  {t.templateTitle}
                </div>
                {parsing && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
              </div>
              <p className="text-xs text-slate-500 mb-3">{t.templateDesc}</p>
              <input
                ref={templateInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                className="hidden"
                onChange={handleTemplateUpload}
              />
              <button
                className="w-full border border-slate-200 rounded-md py-2 text-sm font-medium text-slate-700 hover:bg-white"
                onClick={() => templateInputRef.current?.click()}
                type="button"
                disabled={parsing}
              >
                {templateName ? `${t.currentTemplate}: ${templateName}` : t.selectTemplate}
              </button>
              <p className="text-[11px] text-slate-400 mt-2">{t.templateHelper}</p>
              <div className="flex items-center gap-2 mt-4">
                <select
                  className="flex-1 border border-slate-200 rounded-md px-2 py-1.5 text-sm"
                  value={templateFormat}
                  onChange={(e) => setTemplateFormat(e.target.value as 'csv' | 'xlsx' | 'xls')}
                >
                  <option value="csv">{t.templateCSV}</option>
                  <option value="xlsx">{t.templateXLSX}</option>
                  <option value="xls">{t.templateXLS}</option>
                </select>
                <button
                  type="button"
                  className="flex-1 border border-slate-200 rounded-md py-1.5 text-sm font-medium text-slate-700 hover:bg-white flex items-center justify-center gap-1"
                  onClick={() => downloadBatchTemplate(templateFormat)}
                >
                  <Download className="w-4 h-4" />
                  {t.templateDownload}
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                {t.parsedSummary.replace('{count}', String(templateRows.length))}
              </div>
              {templateRows.length > 0 && (
                <p className="text-xs text-slate-500 mt-2">
                  {t.summaryHint}
                </p>
              )}
            </div>

            <button
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleBatchStart}
              disabled={isBatchRunning}
              type="button"
            >
              {isBatchRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isBatchRunning ? t.batchRunning : t.startBatch}
            </button>

            {exportButton}
          </div>
        ) : (
          <div className="flex flex-col space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.textContent}
              </label>
              <textarea
                className="w-full h-32 p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-slate-50"
                placeholder={t.textPlaceholder}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
              />
            </div>

            {renderMediaControls()}

            <button
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleStartReview}
              disabled={isRunning}
              type="button"
            >
              {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isRunning ? t.running : t.startReview}
            </button>
          </div>
        )}

        {/* Language Toggle - Bottom Left */}
        <div className="mt-auto pt-6 border-t border-slate-100">
            <button 
                onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors px-2 py-1.5 rounded-md hover:bg-slate-50 w-full"
            >
                <Languages className="w-4 h-4" />
                <span className="text-sm font-medium">{language === 'zh' ? 'English' : '中文'}</span>
            </button>
        </div>
      </div>
    </div>
  );
};

