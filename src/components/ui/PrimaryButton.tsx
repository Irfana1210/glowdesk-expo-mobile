import { BaseButton, type ButtonProps } from './Button';

export function PrimaryButton(props: ButtonProps) {
  return <BaseButton variant="primary" {...props} />;
}
