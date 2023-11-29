import { Alert } from "@material-tailwind/react";

type Props = {
  message: string;
  color: any;
};

export const AlertMessage = ({ message, color }: Props) => {
  return (
    <div className="absolute w-full rounded">
      <div className="relative flex w-full flex-col gap-2 p-4 text-xs">
        <Alert color={color}>{message}</Alert>
      </div>
    </div>
  );
};
