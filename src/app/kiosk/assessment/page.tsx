
'use client';

import React, { useEffect, useReducer, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { phq9Questions, gad7Questions } from '@/lib/assessment-questions';
import { submitAndGetRecommendations, type ResourceRecommendationsOutput } from '@/lib/actions';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ResourceList } from '@/components/resource-list';
import { ResourceCardSkeleton } from '@/components/resource-card-skeleton';

const allQuestions = [
  ...phq9Questions.map(q => ({ ...q, type: 'phq9' })),
  ...gad7Questions.map(q => ({ ...q, type: 'gad7' })),
];
const totalQuestions = allQuestions.length;

type State = {
  answers: { [key: string]: string };
  currentQuestionIndex: number;
  additionalContext: string;
  status: 'idle' | 'submitting' | 'success' | 'error';
  error?: string;
  recommendations?: ResourceRecommendationsOutput;
};

type Action =
  | { type: 'ANSWER_QUESTION'; payload: { questionId: string; value: string } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREVIOUS_QUESTION' }
  | { type: 'UPDATE_CONTEXT'; payload: string }
  | { type: 'SUBMIT' }
  | { type: 'SUBMIT_SUCCESS'; payload: ResourceRecommendationsOutput }
  | { type: 'SUBMIT_ERROR'; payload: string }
  | { type: 'RESET' };

const initialState: State = {
  answers: {},
  currentQuestionIndex: 0,
  additionalContext: '',
  status: 'idle',
};

function assessmentReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ANSWER_QUESTION':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.questionId]: action.payload.value,
        },
      };
    case 'NEXT_QUESTION':
      if (state.currentQuestionIndex < totalQuestions) {
        return { ...state, currentQuestionIndex: state.currentQuestionIndex + 1 };
      }
      return state;
    case 'PREVIOUS_QUESTION':
      if (state.currentQuestionIndex > 0) {
        return { ...state, currentQuestionIndex: state.currentQuestionIndex - 1 };
      }
      return state;
    case 'UPDATE_CONTEXT':
      return { ...state, additionalContext: action.payload };
    case 'SUBMIT':
      return { ...state, status: 'submitting' };
    case 'SUBMIT_SUCCESS':
      return { ...state, status: 'success', recommendations: action.payload };
    case 'SUBMIT_ERROR':
      return { ...state, status: 'error', error: action.payload };
    case 'RESET':
        return initialState;
    default:
      return state;
  }
}

function KioskAssessmentImpl() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const { toast } = useToast();
    const [state, dispatch] = useReducer(assessmentReducer, initialState);
    
    useEffect(() => {
        if (!patientId || !doctorId) {
            toast({
                title: "Error",
                description: "Missing required patient or doctor ID.",
                variant: "destructive"
            });
            router.push('/kiosk');
        }
    }, [patientId, doctorId, router, toast]);
    
    const { currentQuestionIndex, answers, additionalContext, status, recommendations } = state;
    const currentQuestion = allQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / (totalQuestions + 1)) * 100;
    const isLastQuestion = currentQuestionIndex === totalQuestions;
    const isAnswered = currentQuestion ? answers[`${currentQuestion.type}_${currentQuestion.id}`] !== undefined : true;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!patientId || !doctorId) return;

        dispatch({ type: 'SUBMIT' });

        const formData = new FormData();
        formData.append('userId', patientId);
        formData.append('doctorId', doctorId);
        Object.entries(answers).forEach(([key, value]) => {
            formData.append(key, value);
        });
        formData.append('additionalContext', additionalContext);
        
        const response = await submitAndGetRecommendations(formData);

        if (response.status === 'success' && response.data) {
            dispatch({ type: 'SUBMIT_SUCCESS', payload: response.data });
        } else {
            dispatch({ type: 'SUBMIT_ERROR', payload: response.error || 'An unknown error occurred.' });
            toast({
                variant: 'destructive',
                title: 'An error occurred',
                description: response.error,
            });
        }
    };
    
    if (status === 'submitting') {
      return (
          <div className="flex flex-col items-center justify-center h-full text-center">
              <ResourceCardSkeleton />
              <h2 className="text-2xl font-semibold mt-6">Analyzing Your Results...</h2>
              <p className="text-muted-foreground">This may take a moment. Please don&apos;t close this page.</p>
          </div>
      );
    }
  
    if (status === 'success') {
        return (
            <div className="mx-auto max-w-3xl space-y-6">
                <Card>
                  <CardHeader className="text-center items-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                    <CardTitle>Assessment Submitted!</CardTitle>
                    <CardDescription>Thank you. Based on your responses, here are some resources that may be helpful.</CardDescription>
                  </CardHeader>
                </Card>
                {recommendations && <ResourceList recommendations={recommendations} />}
                 <div className="text-center">
                  <Button asChild>
                      <Link href="/kiosk">Finish & Return to Home</Link>
                  </Button>
                 </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl">
          <Card className="shadow-lg">
            <CardHeader>
              <Progress value={progress} className="mb-4" />
              {isLastQuestion ? (
                 <>
                    <CardTitle className="text-2xl font-headline">Additional Information</CardTitle>
                    <CardDescription>Provide any extra context for your doctor. This is optional.</CardDescription>
                 </>
              ) : (
                <>
                    <CardTitle className="text-2xl font-headline">{`Over the last 2 weeks, how often have you been bothered by the following problems?`}</CardTitle>
                    <CardDescription>
                        Question {currentQuestionIndex + 1} of {totalQuestions}
                    </CardDescription>
                </>
              )}
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="min-h-[200px]">
                {isLastQuestion ? (
                    <Textarea
                        id="additionalContext"
                        name="additionalContext"
                        placeholder="e.g., I&apos;ve been having trouble sleeping..."
                        className="resize-none min-h-[150px] text-base"
                        value={additionalContext}
                        onChange={(e) => dispatch({ type: 'UPDATE_CONTEXT', payload: e.target.value })}
                    />
                ) : (
                    <div className="space-y-4">
                        <p className="text-lg font-semibold">{currentQuestion.question}</p>
                        <RadioGroup
                          name={`${currentQuestion.type}_${currentQuestion.id}`}
                          onValueChange={(value) => dispatch({ type: 'ANSWER_QUESTION', payload: { questionId: `${currentQuestion.type}_${currentQuestion.id}`, value }})}
                          value={answers[`${currentQuestion.type}_${currentQuestion.id}`] || ''}
                        >
                          {currentQuestion.options.map(option => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={String(option.value)} id={`${currentQuestion.type}_${currentQuestion.id}_${option.value}`} />
                              <Label htmlFor={`${currentQuestion.type}_${currentQuestion.id}_${option.value}`} className="font-normal text-base">{option.label}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                    </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => dispatch({ type: 'PREVIOUS_QUESTION' })}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                {isLastQuestion ? (
                    <Button type="submit">Submit Assessment</Button>
                ) : (
                    <Button
                        type="button"
                        onClick={() => dispatch({ type: 'NEXT_QUESTION' })}
                        disabled={!isAnswered}
                    >
                        Next
                    </Button>
                )}
              </CardFooter>
            </form>
          </Card>
        </div>
      );
}

export default function KioskAssessmentPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <KioskAssessmentImpl />
        </Suspense>
    )
}
