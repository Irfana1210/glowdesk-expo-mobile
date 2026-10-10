import { type FC } from "react";

import { BaseButton, type ButtonProps } from "./button";

export const SecondaryButton: FC<ButtonProps> = (props) => {
  return <BaseButton variant="secondary" {...props} />;
};
