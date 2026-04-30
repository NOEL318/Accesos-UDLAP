import { Delete } from "lucide-react"
import { NumericKey } from "./NumericKey"

interface Props {
  onDigit: (d: string) => void
  onBackspace: () => void
  disabled?: boolean
}

// teclado numerico para ingresar el PIN del oficial
export function PinKeypad({ onDigit, onBackspace, disabled }: Props) {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
  return (
    <div className="grid grid-cols-3 gap-3">
      {digits.map((d) => (
        <NumericKey key={d} label={d} onClick={() => onDigit(d)} disabled={disabled} />
      ))}
      <NumericKey variant="muted" label="" onClick={() => {}} disabled />
      <NumericKey label="0" onClick={() => onDigit("0")} disabled={disabled} />
      <NumericKey
        variant="muted"
        label={<Delete className="size-5" />}
        onClick={onBackspace}
        disabled={disabled}
      />
    </div>
  )
}
