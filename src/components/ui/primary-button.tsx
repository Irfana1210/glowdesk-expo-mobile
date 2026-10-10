import { type FC } from "react";

import { BaseButton, type ButtonProps } from "./button";

export const PrimaryButton: FC<ButtonProps> = (props) => {
  return <BaseButton variant="primary" {...props} />;
};
