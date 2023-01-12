import React from "react";
import { FormProps, IChangeEvent, ThemeProps } from "react-jsonschema-form";

export default class Form<T> extends React.Component<FormProps<T>> {
  public triggerChange(newData: T) {
    this.props.onChange?.({ formData: newData } as IChangeEvent<T>);
  }

  public render() {
    return null;
  }
}

export function withTheme<T = any>(theme: ThemeProps<T>) {
  return Form;
}
