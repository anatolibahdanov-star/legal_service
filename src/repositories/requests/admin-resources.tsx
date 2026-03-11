/* eslint-disable react/jsx-key */
import { useRecordContext, useRefresh, useUpdate, Button, useNotify, useEditController, InputProps, ReferenceInput, Filter, DateInput, RichTextField, Show, SimpleShowLayout, required, SelectInput, TextInput, SimpleForm, Edit, List, Datagrid, DateField, TextField, SelectField, EditButton, DeleteButton, FilterProps, EditControllerProps} from 'react-admin';
import {RichTextInput} from "ra-input-rich-text"
import { JSX } from 'react/jsx-runtime';
import { Typography, Box } from '@mui/material';
import { QuestionStatuses, QuestionEmailStatuses } from '@/src/interfaces/data';
import CopyToClipboardButton from "@/src/app/components/admin/CopyToClipboardButton"
import {Tooltip, TooltipTrigger, TooltipContent } from "@/src/app/components/ui/tooltip"
import AdjustIcon from '@mui/icons-material/Adjust';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useFormContext } from 'react-hook-form';

const nextMonth = new Date()
nextMonth.setMonth(nextMonth.getMonth() + 1);

const RequestFilters = (props: JSX.IntrinsicAttributes) => (
    <Filter {...props}>
        <TextInput label="Пользователь" source="username" />
        <TextInput label="Вопрос" source="question" />
        <ReferenceInput label="Категория" source="category" reference="categories">
            <SelectInput optionText="name" />
        </ReferenceInput>
        <SelectInput label="Статус" source="status" choices={QuestionStatuses} />
        <SelectInput label="E-mail" source="email" choices={QuestionEmailStatuses} />
        <DateInput label="С" source="published_at_gte" defaultValue={(new Date()).toISOString().split('T')[0]} />
        <DateInput label="До" source="published_at_lte" defaultValue={nextMonth.toISOString().split('T')[0]} />
    </Filter>
);

const defaultLoading = <p>Загружаем вопросы...</p>

export const RequestList = () => (
    <List sort={{ field: 'id', order: 'DESC' }} filters={<RequestFilters />} loading={defaultLoading}>
        <Datagrid>
            <TextField source="id" />
            <TextField source="username" />
            <TextField label="Category" source="category_name" />
            <TextField source="question" />
            <SelectField source='status' choices={QuestionStatuses} optionValue={'status'} />
            <SelectField label="Email" source='email_status' choices={QuestionEmailStatuses} optionValue={'email_status'} />
            <DateField source='created_at' locales="ru-RU" />
            <>
                <EditButton />
                <DeleteButton />
            </>
        </Datagrid>
    </List>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RequestEdit = (props: EditControllerProps<any, Error> | undefined) => {
    const notify = useNotify();
    const { record, isPending } = useEditController(props)
    if (isPending) {
        return <div>Loading...</div>;
    }

    if (!record) {
        return <div>No record found</div>;
    }

    const onFailure = (error: Error) => {
        // Log the error, show a custom notification, or redirect
        notify("A generic error occurred: " + error.message, { type: 'error' });
        // Optional: redirect after error
        // redirect("list", props.basePath);
    };

    const {username, category_name, question} = record;
    return (
        <Edit loading={<p>Loading the question details...</p>} mutationOptions={{ onError: onFailure }}>
            <SimpleForm>
                <TextInput source="reply_id" style={{ display: 'none' }} />
                <TextInput source="final_reply_id" style={{ display: 'none' }} />
                <RequestInfoHtmlInput username={username} category_name={category_name} source={question} />
                <MyCustomHtmlInput source="https://ai.conslegal.ru/" label="Консультант+ AI" />
                <RichTextInput source="reply" validate={[required()]} />
                <CustomSaveButton />
                <RichTextInput source="final_reply" />
                <SelectInput source="status" choices={QuestionStatuses} />
            </SimpleForm>
        </Edit>
    )
};

export const RequestShow = () => (
    <Show loading={<p>Loading the questions...</p>}>
        <SimpleShowLayout>
            <TextField source="id" />
            <TextField source="username" />
            <TextField label="Category" source="category_name" />
            <TextField source="question" />
            <TextField source="reply_id" />
            <RichTextField source="reply" />
            <TextField source="final_reply_id" />
            <RichTextField source="final_reply" />
            <SelectField source='status' choices={QuestionStatuses} optionValue={'status'} />
            <SelectField label="Email" source='email_status' choices={QuestionEmailStatuses} optionValue={'email_status'} />
            <DateField label="Created date" source="created_at" />
        </SimpleShowLayout>
    </Show>
);

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
        <>
            <Typography variant="h6">{label}</Typography>
            <iframe src={source} name="myIframe" width="100%" height="300"></iframe>
        </>
    );
};

interface RequestInfoInputProps extends InputProps {
    username: string;
    category_name: string;
    source: string;
}

const RequestInfoHtmlInput: React.FC<RequestInfoInputProps> = (props) => {
    const { username, category_name, source } = props;

    // You can access the current record if needed using useRecordContext
    // const record = useRecordContext();
    // Example of custom HTML/JSX
    return (
        <>
            <Typography variant="h6">
                Информация
                <Tooltip>
                    <TooltipTrigger asChild>
                        <AdjustIcon />
                    </TooltipTrigger>
                    <TooltipContent className='TooltipContent' sideOffset={5}>
                        Пользователь: {username}, Категория: {category_name}
                    </TooltipContent>
                </Tooltip>
            </Typography>
            <CopyToClipboardButton textToCopy={source} />
        </>
    );
};

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
    );
    
    // You would then dispatch your data provider mutation here (e.g., using useUpdate)
    // For demonstration, we'll just log and redirect
    console.log('Old:', record); 
    console.log('Saving and Publishing:', dataToSave); 
    
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