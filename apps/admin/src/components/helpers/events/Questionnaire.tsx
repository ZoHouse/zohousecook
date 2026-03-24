import AddIcon from "@mui/icons-material/Add";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { useVisibilityState } from "@zo/utils/hooks";
import { Button, Flex, Switch, Tag, Typography } from "antd";
import { CASQuestions } from "apps/admin/src/config";
import moment from "moment";
import React from "react";
import { useQueryClient } from "react-query";
import { CustomQuestionSidebar } from "../../sidebars";

const { Title, Text } = Typography;

interface QuestionnaireProps {
  questionnaireId: string | undefined;
}

const CustomQuestionTypesMap = {
  text: "Text",
  number: "Number",
  multiselect: "Multiple Select",
  select: "Single Select",
};

const Questionnaire: React.FC<QuestionnaireProps> = ({ questionnaireId }) => {
  const queryClient = useQueryClient();

  const [
    isCustomQuestionSidebarVisible,
    showCustomQuestionSidebar,
    hideCustomQuestionSidebar,
  ] = useVisibilityState();

  const { data: customQuestions } = useQueryApi<CASQuestions[]>(
    "CAS_QUESTIONNAIRES",
    {
      enabled: questionnaireId != null,
      select: (data) =>
        data.data.results.sort((a: CASQuestions, b: CASQuestions) => {
          const aDate = moment(a.created_at);
          const bDate = moment(b.created_at);
          return aDate.diff(bDate);
        }),
      refetchOnWindowFocus: false,
    },
    `${questionnaireId}/questions/`
  );

  const { mutate: updateQuestion } = useMutationApi(
    "CAS_QUESTIONNAIRES",
    {},
    "",
    "PUT"
  );

  const toggleQuestionStatus = (
    value: boolean,
    data: GeneralObject | undefined
  ) => {
    if (data) {
      updateQuestion(
        {
          data: {
            status: value ? "active" : "inactive",
          },
          route: `${questionnaireId}/questions/${data.questionId}/`,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries(["cas", "questionnaires"]);
          },
        }
      );
    }
  };

  return (
    <>
      <Flex vertical gap="24px">
        <Typography.Text
          strong
          type="secondary"
          style={{ textTransform: "uppercase", fontSize: "16px" }}
        >
          Booking Info
        </Typography.Text>

        <Button
          icon={<AddIcon />}
          className="w-fit"
          onClick={showCustomQuestionSidebar}
        >
          Question
        </Button>

        <Flex vertical gap="small" className="w-full md:w-1/2 mt-4">
          {customQuestions?.map((question: CASQuestions) => (
            <Flex
              key={question.id}
              vertical
              gap="middle"
              className="w-full bg-zui-light p-4 relative rounded-md shadow-sm hover:shadow-md transition-shadow border border-zui-lightest"
            >
              <div className="absolute top-4 right-4">
                <Switch
                  checked={question.status === "active"}
                  onChange={(checked) =>
                    toggleQuestionStatus(checked, { questionId: question.id })
                  }
                  size="small"
                />
              </div>

              <Typography.Text strong className="pr-8">
                {question.text}
              </Typography.Text>

              {question.options && (
                <Flex wrap gap="small">
                  {question.choices.map(
                    (option: { label: string; value: string }) => (
                      <Tag
                        key={option.value}
                        className="px-3 py-1 border border-zui-silver rounded-full"
                      >
                        {option.label}
                      </Tag>
                    )
                  )}
                </Flex>
              )}

              <Tag className="px-4 py-1 border border-zui-lighter text-sm capitalize w-fit">
                {CustomQuestionTypesMap[question.format] || question.format}
              </Tag>
            </Flex>
          ))}
        </Flex>
      </Flex>
      <CustomQuestionSidebar
        isOpen={isCustomQuestionSidebarVisible}
        onClose={hideCustomQuestionSidebar}
        questionnaireId={questionnaireId}
      />
    </>
  );
};

export default Questionnaire;
