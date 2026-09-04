"use client";

import { type ReactNode, useId } from "react";

import { Field, FieldTitle } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type AppearanceOption<T extends string> = {
  value: T;
  label: string;
  color?: string;
  icon?: ReactNode;
  disabled?: boolean;
};

function OptionLabel({ option }: { option: AppearanceOption<string> }) {
  return (
    <>
      {option.color && (
        <span
          aria-hidden="true"
          className="size-3 shrink-0 rounded-full border"
          style={{ backgroundColor: option.color }}
        />
      )}
      {option.icon}
      {option.label}
    </>
  );
}

export function AppearanceSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly AppearanceOption<T>[];
  onChange: (value: T) => void;
}) {
  const id = useId();
  const selected = options.find((option) => option.value === value);
  return (
    <Field orientation="responsive">
      <FieldTitle id={id}>{label}</FieldTitle>
      <Select
        items={options}
        value={value}
        onValueChange={(next) => {
          const option = options.find((item) => item.value === next);
          if (option && !option.disabled) onChange(option.value);
        }}
      >
        <SelectTrigger aria-labelledby={id} className="w-full @md/field-group:min-w-48 @md/field-group:shrink-0">
          <SelectValue>{selected ? <OptionLabel option={selected} /> : null}</SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} align="end">
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                <OptionLabel option={option} />
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

export function AppearanceChoice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly AppearanceOption<T>[];
  onChange: (value: T) => void;
}) {
  const id = useId();
  return (
    <Field orientation="responsive">
      <FieldTitle id={id}>{label}</FieldTitle>
      <ToggleGroup
        variant="outline"
        value={[value]}
        aria-labelledby={id}
        className="flex-wrap justify-start"
        onValueChange={([next]) => {
          const option = options.find((item) => item.value === next);
          if (option) onChange(option.value);
        }}
      >
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value} aria-label={option.label}>
            <OptionLabel option={option} />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
  );
}
