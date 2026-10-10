import { type FC } from "react";

import { BaseButton, type ButtonProps } from "./Button";

export const PrimaryButton: FC<ButtonProps> = (props) => {
  return <BaseButton variant="primary" {...props} />;
};
