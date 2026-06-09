/* eslint-disable react/jsx-key */
import { RecordContext, ShowControllerProps, FunctionField, useRecordContext, useRefresh, useUpdate, Button, useNotify, useEditController, InputProps, ReferenceInput, Filter, DateInput, Show, SimpleShowLayout, required, SelectInput, TextInput, SimpleForm, Edit, List, Datagrid, DateField, TextField, SelectField, EditButton, DeleteButton, EditControllerProps, useShowController, Toolbar, SaveButton} from 'react-admin';
import {RichTextInput, DefaultEditorOptions} from "ra-input-rich-text"
import { EditMarkHighlight } from "@/src/app/components/admin/editMarkHighlight"
import { JSX } from 'react/jsx-runtime';
import { Typography, Box } from '@mui/material';
import { QuestionStatusesE, EmailStatusesE } from '@/src/interfaces/data';
import { getAdminChoices } from '@/src/helpers/tools';
import CopyToClipboardButton from "@/src/app/components/admin/CopyToClipboardButton"
import {Tooltip, TooltipTrigger, TooltipContent } from "@/src/app/components/ui/tooltip"
import AdjustIcon from '@mui/icons-material/Adjust';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { PdfIcon } from "@/src/app/components/popups/pdf";
import { Loader2 } from "lucide-react";
import { useFormContext, useWatch } from 'react-hook-form';
import React, { useEffect, useState } from 'react';
import { JobDataI } from '@/src/interfaces/form';
import { CustomGetRequest } from "@/src/libs/request"
import { AdminJobView } from '@/src/app/components/admin/AdminJobView';
import { DBQuestion } from '@/src/interfaces/db';

const nextMonth = new Date()
nextMonth.setMonth(nextMonth.getMonth() + 1);

// Rich-text editor options that additionally highlight Grok's {{...}} edit
// markup in red so the lawyer can see what the AI changed while editing.
const editorOptions = {
    ...DefaultEditorOptions,
    extensions: [...(DefaultEditorOptions.extensions ?? []), EditMarkHighlight],
};

const RequestFilters = (props: JSX.IntrinsicAttributes) => (
    <Filter {...props}>
        <TextInput label="Пользователь" source="username" />
        <TextInput label="E-mail" source="email" />
        <TextInput label="Вопрос" source="question" />
        <ReferenceInput label="Категория" source="category" reference="categories">
            <SelectInput optionText="name" />
        </ReferenceInput>
        <SelectInput label="Статус" source="status" choices={getAdminChoices(QuestionStatusesE, "Статус обработки вопроса: ", true)} />
        <SelectInput label="Отправка" source="email_status" choices={getAdminChoices(EmailStatusesE, "Статус отправки уведомления: ", true)} />
        <DateInput label="С" source="published_at_gte" defaultValue={(new Date()).toISOString().split('T')[0]} />
        <DateInput label="До" source="published_at_lte" defaultValue={nextMonth.toISOString().split('T')[0]} />
    </Filter>
);

const defaultLoading = <p>Загружаем вопросы...</p>

export const RequestList = () => (
    <List sort={{ field: 'id', order: 'DESC' }} filters={<RequestFilters />} loading={defaultLoading}>
        <Datagrid>
            <TextField source="id" />
            <TextField label="Пользователь" source="username" />
            <TextField label="Юрист" source="owner" />
            <TextField label="Категория" source="category_name" />
            <FunctionField label="Вопрос" source="question" render={record => {
                    const value = record.question;
                    if (value && value.length > 200) {
                        return value.substring(0, 200) + '...';
                    }
                    return value;
                }} />
            <SelectField label="Статус" source='job_status' choices={getAdminChoices(QuestionStatusesE, "Статус обработки вопроса: ")} optionValue={'status'} />
            <SelectField label="Email" source='email_status' choices={getAdminChoices(EmailStatusesE, "Статус отправки уведомления: ")} optionValue={'email_status'} />
            <DateField label="Дата" source='created_at' locales="ru-RU" showTime />
            <>
                <EditButton />
                <DeleteButton />
            </>
        </Datagrid>
    </List>
);

interface PresetFieldLogicPropsI {
    lastRecord: DBQuestion;
}

const PresetFieldLogic = ({lastRecord}: PresetFieldLogicPropsI) => {
    const { setValue } = useFormContext();

    useEffect(() => {
        console.log('lastRecord in PresetFieldLogic', lastRecord)
        setValue("child_id", lastRecord.id, { shouldDirty: true });
        setValue("reply_id", lastRecord.reply_id, { shouldDirty: true });
        setValue("reply", lastRecord.reply, { shouldDirty: true });
        setValue("final_reply_id", lastRecord.final_reply_id, { shouldDirty: true });
        setValue("final_reply", lastRecord.final_reply, { shouldDirty: true });
    }, [lastRecord, setValue]);
    
    return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RequestEdit = (props: EditControllerProps<any, Error> | undefined) => {
    const [data, setData] = useState<JobDataI | null>(null);
    const notify = useNotify();
    const { record, error, isPending } = useEditController(props)

    useEffect(() => {
        if(record) {
            const path = "/requests/" + record.id
            const request = {parent_id: record.id}
            
            const fetchData = async () => {
                const jobData = await CustomGetRequest(path, request)
                if(jobData.status) {
                    const count = jobData.count ?? 0
                    setData({data: jobData.data, count: count})
                }
            };

            fetchData();
        }
        
    }, [record]);

    if (isPending) {
        return <div>Загружаем запрос...</div>;
    }

    if (error) {
        return <div>Ошибка при загрузке Запроса: {error.message}</div>;
    }

    if (!record) {
        return <div>Запрос не найден.</div>;
    }

    const onFailure = (error: Error) => {
        // Log the error, show a custom notification, or redirect
        notify("A generic error occurred: " + error.message, { type: 'error' });
        // Optional: redirect after error
        // redirect("list", props.basePath);
    };

    if(data === null) return (<>Не найдено...</>)
    const jobs = data.data

    const lastLawyerMessage = jobs && jobs.length > 1 ? jobs.at(-1) : record;

    return (
        <Edit loading={<p>Loading the question details...</p>} mutationOptions={{ onError: onFailure }}>
            <RecordContext.Consumer>
                {recordContext => {
                    // Modify the record before passing it to the form
                    const modifiedRecord = { 
                        ...recordContext, 
                        child_id: lastLawyerMessage.id,
                        reply_id: lastLawyerMessage.reply_id,
                        reply: lastLawyerMessage.reply,
                        final_reply_id: lastLawyerMessage.final_reply_id,
                        final_reply: lastLawyerMessage.final_reply,
                    };
                    return (
                        <SimpleForm record={modifiedRecord} toolbar={<EditToolbar />}>
                            <AdminJobView record={record} jobs={jobs} />
                            <TextInput source="child_id" style={{ display: 'none' }} />
                            <TextInput source="reply_id" style={{ display: 'none' }} />
                            <TextInput source="final_reply_id" style={{ display: 'none' }} />
                            <MyCustomHtmlInput source="https://ai.conslegal.ru/" label="Консультант+ AI" />
                            <RichTextInput source="reply" validate={[required()]} editorOptions={editorOptions} />
                            <CustomSaveButton />
                            <RichTextInput source="final_reply" editorOptions={editorOptions} />
                            <SelectInput label="Статус" source="job_status" choices={getAdminChoices(QuestionStatusesE, "Статус обработки вопроса: ", true)} />
                            {/* <PresetFieldLogic lastRecord={lastLawyerMessage} /> */}
                        </SimpleForm>
                    );
                }}
            </RecordContext.Consumer>
            
        </Edit>
    )
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RequestShow = (props: ShowControllerProps<any, Error> | undefined) => {
    const [data, setData] = useState<JobDataI | null>(null);
    const { record, error, isPending } = useShowController(props)

    useEffect(() => {
        const path = "/requests/" + record.id
        const request = {parent_id: record.id}
        
        const fetchData = async () => {
            const jobData = await CustomGetRequest(path, request)
            if(jobData.status) {
                const count = jobData.count ?? 0
                setData({data: jobData.data, count: count})
            }
        };

        fetchData();
    }, [record.id]);

    if (isPending) {
        return <div>Загружаем запрос...</div>;
    }

    if (error) {
        return <div>Ошибка при загрузке Запроса: {error.message}</div>;
    }

    if (!record) {
        return <div>Запрос не найден.</div>;
    }

    if(data === null) return (<>Не найдено...</>)
    const jobs = data.data

    return (
        <Show loading={<p>Загружаем запрос...</p>}>
            <SimpleShowLayout>
                <AdminJobView record={record} jobs={jobs} />
            </SimpleShowLayout>
        </Show>
    )
};

interface MyCustomHtmlInputProps extends InputProps {
    source: string;
    label: string;
}

const MyCustomHtmlInput: React.FC<MyCustomHtmlInputProps> = (props) => {
    const { source, label } = props;

    // You can access the current record if needed using useRecordContext
    // const record = useRecordContext();
    // Example of custom HTML/JSX
    return (
        <Box
            sx={{
                width: '100%',
                height: 600,
                bgcolor: 'primary.main', // Accesses theme primary color
                '&:hover': {
                bgcolor: 'primary.dark',
                },
                p: 2, // Shorthand for padding
            }}
        >
            <Typography variant="h6">{label}</Typography>
            <iframe src={source} name="myIframe" width="100%" height="500"></iframe>
        </Box>
    );
};

const PDF_LOADING_HTML = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<title>Генерация PDF…</title><style>
html,body{height:100%;margin:0}
body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;
font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#fff;color:#64748b}
.s{width:48px;height:48px;border:5px solid #e2e8f0;border-top-color:#323c54;border-radius:50%;
animation:r .8s linear infinite}
@keyframes r{to{transform:rotate(360deg)}}
</style></head><body><div class="s"></div><div>Генерируем PDF…</div></body></html>`;

const plainText = (html: unknown): string =>
  typeof html === 'string'
    ? html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
    : '';

const htmlHasText = (html: unknown): boolean => plainText(html).length > 0;

const PdfDraftButton = () => {
  const notify = useNotify();
  const record = useRecordContext();
  const finalReply = useWatch({ name: 'final_reply' });
  const childId = useWatch({ name: 'child_id' });
  const [loading, setLoading] = useState(false);

  const pdfId = record?.short_id ?? record?.uuid;
  const hasAnswer = htmlHasText(finalReply);

  const answerChanged = plainText(finalReply) !== plainText(record?.final_reply);

  const handleClick = async () => {
    if (!pdfId || !hasAnswer || loading) return;
    const viewer = window.open('', '_blank');
    if (viewer) {
      viewer.document.write(PDF_LOADING_HTML);
      viewer.document.close();
    }

    if (!answerChanged) {
      const url = `/api/pdf/${pdfId}`;
      if (viewer) viewer.location.href = url;
      else window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/pdf/${pdfId}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyHtml: finalReply, childId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Не удалось сформировать PDF.');
      }
      const url = `/api/pdf/${pdfId}/draft`;
      if (viewer) viewer.location.href = url;
      else window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      if (viewer) viewer.close();
      notify((err as Error).message, { type: 'warning' });
    } finally {
      setLoading(false);
    }
  };

  const disabled = !hasAnswer || loading;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label="Сгенерировать и открыть PDF"
      title={
        !hasAnswer
          ? 'Доступно после получения ответа от Grok'
          : answerChanged
            ? 'Сгенерировать PDF из текущего (несохранённого) ответа и открыть в новой вкладке'
            : 'Открыть актуальный PDF в новой вкладке'
      }
      className={`ml-4 inline-flex items-center justify-center p-2 rounded-lg border-2 transition-colors ${
        disabled
          ? 'border-[#e0e0e0] text-[#c0c0c0] cursor-not-allowed opacity-60'
          : 'border-[#8faaba] text-[#8faaba] hover:border-[#ef4444] hover:text-[#ef4444]'
      }`}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <PdfIcon />}
    </button>
  );
};

const EditToolbar = () => (
  <Toolbar>
    <SaveButton />
    <PdfDraftButton />
  </Toolbar>
);

const CustomSaveButton = () => {
  const notify = useNotify();
  const { handleSubmit } = useFormContext(); // Get form submission handler
  const [update, { isLoading }] = useUpdate();
  const refresh = useRefresh();
  const record = useRecordContext();

  const handleSaveAndPublish = handleSubmit(values => {
    // Custom logic: e.g., add a 'status: published' field before actual save
    const dataToSave = { ...values, isGenerate: true };

    update(
        'requests', // resource name
        { id: record?.id ?? "", data: dataToSave, previousData: record },
        {
            onSuccess: () => {
                notify('Информация обработана!', { type: 'success' });
                refresh(); // Refresh the current page to show updated status
                // Optional: redirect after success
                // redirect('list', 'posts'); 
            },
            onError: (error) => {
                notify(`Error: ${error.message}`, { type: 'warning' });
            }
        }
    )
  });

  return (
    <Button 
        disabled={isLoading}
        variant="contained"
        color="primary"
        startIcon={<CheckCircleIcon />}
        label="Обработать в Grok " 
        onClick={handleSaveAndPublish} 
      // You can also use react-admin's <SaveButton> and override the mutationOptions or redirect prop for simpler cases
    />
  );
};
