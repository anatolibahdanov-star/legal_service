import { Dialog } from "radix-ui";
import { MessagePropsI } from '@/src/interfaces/form';

const MyModal = ({ open, setOpen }: MessagePropsI) => {

  // 2. A function to open the dialog programmatically

  // 3. A function to handle some action and close the dialog
//   const handleSubmitAndClose = async () => {
//     // Perform asynchronous operations, e.g., form submission
//     await new Promise(resolve => setTimeout(resolve, 1000));
//     setOpen(false); // Close the dialog after the operation
//   };

  return (
    <>

      {/* 4. Pass the open state and change handler to Dialog.Root */}
      <Dialog.Root open={true}>
        {/* Dialog.Trigger can still be used, but is not necessary for programmatic control */}
        {/* <Dialog.Trigger>Open (alternative trigger)</Dialog.Trigger> */}

        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title>Успешная операция</Dialog.Title>
            <Dialog.Description>
              Вы успешно сохранили новые данные о себе.
            </Dialog.Description>

            {/* Radix provides a built-in close button primitive */}
            <Dialog.Close asChild>
              <button>Close</button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};

export default MyModal;

