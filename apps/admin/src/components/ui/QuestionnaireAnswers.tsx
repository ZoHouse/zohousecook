import React from "react";
import { QuestionnaireAnswer } from "../../config";

interface QuestionnaireAnswersProps {
  questions: QuestionnaireAnswer[];
}
const QuestionnaireAnswers: React.FC<QuestionnaireAnswersProps> = ({
  questions,
}) => {
  return (
    <div>
      <h2 className="textbase text-zui-silver uppercase font-semibold my-6">
        Answers
      </h2>
      <div className="flex flex-col space-y-6 items-start w-full">
        {questions.map((question) => (
          <div>
            <div className="flex gap-2">{question.question.text}</div>
            <div className="mt-1 text-zui-silver">
              {question.question.format === "text" ||
              question.question.format === "number"
                ? question.content
                : question.choices.join(", ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionnaireAnswers;
