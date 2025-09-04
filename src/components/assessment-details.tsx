
'use client';

import { phq9Questions, gad7Questions } from '@/lib/assessment-questions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { type Assessment } from '@/lib/firebase/firestore-types';
import { AddNoteDialog } from './assessment-history';

const getScoreVariant = (value: number): 'score_0' | 'score_1' | 'score_2' | 'score_3' => {
  switch (value) {
    case 0: return 'score_0';
    case 1: return 'score_1';
    case 2: return 'score_2';
    case 3: return 'score_3';
    default: return 'score_0';
  }
};

const QuestionDetail = ({ question, answerValue }: { question: any; answerValue: number }) => {
  const selectedOption = question.options.find((opt: any) => opt.value === answerValue);
  return (
    <div className="flex justify-between items-center py-3 border-b last:border-b-0">
      <span className="text-sm text-foreground/90 pr-4">{question.question}</span>
      <Badge variant={getScoreVariant(answerValue)} className="text-base w-8 h-8 flex items-center justify-center shrink-0">
        {answerValue}
      </Badge>
    </div>
  );
};

function getSeverity(score: number, type: 'phq9' | 'gad7'): string {
    if (type === 'phq9') {
        if (score <= 4) return 'Minimal Depression';
        if (score <= 9) return 'Mild Depression';
        if (score <= 14) return 'Moderate Depression';
        if (score <= 19) return 'Moderately Severe Depression';
        return 'Severe Depression';
    }
    // GAD-7
    if (score <= 4) return 'Minimal Anxiety';
    if (score <= 9) return 'Mild Anxiety';
    if (score <= 14) return 'Moderate Anxiety';
    return 'Severe Anxiety';
}

export function AssessmentDetails({ assessment, viewerRole, onNoteAdded }: { assessment: Assessment, viewerRole: 'patient' | 'doctor', onNoteAdded?: () => void }) {
  const phq9Answers = assessment.answers?.phq9 || {};
  const gad7Answers = assessment.answers?.gad7 || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">PHQ-9 Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{assessment.phq9Score}</p>
            <p className="text-sm text-muted-foreground">{getSeverity(assessment.phq9Score, 'phq9')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">GAD-7 Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{assessment.gad7Score}</p>
            <p className="text-sm text-muted-foreground">{getSeverity(assessment.gad7Score, 'gad7')}</p>
          </CardContent>
        </Card>
      </div>

      {assessment.additionalContext && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Additional Patient Context</h3>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm italic text-muted-foreground">&quot;{assessment.additionalContext}&quot;</p>
            </CardContent>
          </Card>
        </div>
      )}

       {viewerRole === 'doctor' && (
        <div>
            <h3 className="text-lg font-semibold mb-2">Doctor&apos;s Note</h3>
            <Card>
                <CardContent className='pt-6'>
                    {assessment.doctorNote ? (
                        <p className="text-sm italic text-muted-foreground">&quot;{assessment.doctorNote}&quot;</p>
                    ): (
                        <p className="text-sm text-muted-foreground">No note has been added for this assessment yet.</p>
                    )}
                </CardContent>
            </Card>
             <div className="mt-4">
                 <AddNoteDialog
                    assessmentId={assessment.id}
                    currentNote={assessment.doctorNote}
                    onNoteAdded={onNoteAdded!}
                 />
             </div>
        </div>
      )}

      <Separator className="my-6" />

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">PHQ-9 Responses</h3>
          <Card>
            <CardContent className="pt-0 px-4">
              {phq9Questions.map(q => (
                <QuestionDetail key={`phq9-${q.id}`} question={q} answerValue={phq9Answers[`phq9_${q.id}`] ?? 0} />
              ))}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">GAD-7 Responses</h3>
          <Card>
            <CardContent className="pt-0 px-4">
              {gad7Questions.map(q => (
                <QuestionDetail key={`gad7-${q.id}`} question={q} answerValue={gad7Answers[`gad7_${q.id}`] ?? 0} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
