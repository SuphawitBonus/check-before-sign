'use client';

import React, { useState, useEffect } from 'react';
import { PackDefinition, PackRules, EvaluationOutput } from '../../lib/engine/types';
import { evaluatePack, getQuestionnaireEnd } from '../../lib/engine/evaluator';
import { decodeAnswersFromShareHash } from '../../lib/engine/sharing';
import QuestionCard from './QuestionCard';
import OutOfScopeView from './OutOfScopeView';
import ResultView from './ResultView';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface EngineContainerProps {
  pack: PackDefinition;
  rules: PackRules;
}

export default function EngineContainer({ pack, rules }: EngineContainerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isOutOfScopeEarly, setIsOutOfScopeEarly] = useState(false);
  const [outOfScopeReason, setOutOfScopeReason] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationOutput | null>(null);

  // Read URL share hash on client mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const decoded = decodeAnswersFromShareHash(window.location.hash);
      if (decoded && Object.keys(decoded).length > 0) {
        setAnswers(decoded);
        const evalResult = evaluatePack(pack, rules, decoded);
        setEvaluation(evalResult);
        if (evalResult.isOutOfScope) {
          setIsOutOfScopeEarly(true);
          setOutOfScopeReason(evalResult.scopeReason || 'ไม่อยู่ในขอบเขต');
        } else {
          setIsCompleted(true);
        }
      }
    }
  }, [pack, rules]);

  const questions = pack.questions;
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerChange = (val: any) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: val,
    }));
  };

  const handleNext = () => {
    // If current question is the scope question, verify immediately
    if (currentQuestion.isScopeQuestion) {
      const currentAns = answers[currentQuestion.id];
      const matchingOpt = currentQuestion.options?.find((o) => o.value === currentAns);

      if (matchingOpt?.isOutOfScope) {
        const scopeRes = rules.evaluateScope(answers);
        setIsOutOfScopeEarly(true);
        setOutOfScopeReason(scopeRes.reason || matchingOpt.helpText || 'ไม่อยู่ในขอบเขตความคุ้มครองของกฎหมายฉบับนี้');
        return;
      }
    }

    // An answer declared in pack.json as `endsQuestionnaire` jumps straight to the
    // result page (every rule "undetermined"); later questions are not asked.
    const endsHere = getQuestionnaireEnd(currentQuestion, answers[currentQuestion.id]) !== null;

    if (!endsHere && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Completed all questions -> Evaluate!
      const evalResult = evaluatePack(pack, rules, answers);
      setEvaluation(evalResult);
      if (evalResult.isOutOfScope) {
        setIsOutOfScopeEarly(true);
        setOutOfScopeReason(evalResult.scopeReason || 'ไม่อยู่ในขอบเขต');
      } else {
        setIsCompleted(true);
      }
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setIsCompleted(false);
    setIsOutOfScopeEarly(false);
    setOutOfScopeReason('');
    setEvaluation(null);
    if (typeof window !== 'undefined' && window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const handleEditAnswers = () => {
    setIsCompleted(false);
    setIsOutOfScopeEarly(false);
    setCurrentQuestionIndex(0);
  };

  // UI convenience only: reopen the questionnaire at one question (answers kept).
  const handleEditQuestion = (questionId: string) => {
    const idx = questions.findIndex((q) => q.id === questionId);
    setIsCompleted(false);
    setIsOutOfScopeEarly(false);
    setCurrentQuestionIndex(idx >= 0 ? idx : 0);
  };

  // When the current answer ends the questionnaire, the button reads
  // "see result" instead of "next question".
  const endsAtCurrent = currentQuestion
    ? getQuestionnaireEnd(currentQuestion, answers[currentQuestion.id]) !== null
    : false;

  // 1. Out of Scope View
  if (isOutOfScopeEarly) {
    return (
      <div className="px-4 py-8 sm:px-6 sm:py-10">
        <OutOfScopeView
          reason={outOfScopeReason}
          helpChannels={pack.meta.helpChannels}
          onReset={handleReset}
          packTitle={pack.meta.title}
        />
      </div>
    );
  }

  // 2. Result View
  if (isCompleted && evaluation) {
    return (
      <div className="px-4 py-8 sm:px-6 sm:py-10">
        <ResultView
          evaluation={evaluation}
          answers={answers}
          onEditAnswers={handleEditAnswers}
          onEditQuestion={handleEditQuestion}
          onReset={handleReset}
        />
      </div>
    );
  }

  // 3. Questionnaire Form
  const progressPercent = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      {/* Back to home / Pack info */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full py-1 text-sm font-medium text-ink-2 hover:text-ink hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>เลือกเรื่องอื่น</span>
        </Link>
        <div className="max-w-[60%] truncate text-sm font-medium text-ink-3">{pack.meta.shortTitle}</div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-meta font-medium text-ink-3">
          <span>ความคืบหน้า</span>
          <span className="font-mono">{progressPercent}%</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-sunk"
          role="progressbar"
          aria-label="ความคืบหน้าของแบบสอบถาม"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <QuestionCard
        question={currentQuestion}
        currentIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        value={answers[currentQuestion.id]}
        onChange={handleAnswerChange}
        onNext={handleNext}
        onPrev={handlePrev}
        isFirst={currentQuestionIndex === 0}
        isLast={endsAtCurrent || currentQuestionIndex === questions.length - 1}
      />
    </div>
  );
}

