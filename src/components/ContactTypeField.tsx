import type { LadderInstruction } from '../types';
import type { EditorAction } from '../editor/model';

export function ContactTypeField({
  instruction,
  networkId,
  onAction,
  inline = false,
}: {
  instruction: LadderInstruction;
  networkId: string;
  onAction: (action: EditorAction) => void;
  inline?: boolean;
}) {
  if (instruction.kind !== 'contact') return null;
  return (
    <label className="inspector-field">
      {inline ? '图上触点类型' : '触点类型'}
      <select
        value={instruction.contactType}
        onChange={(event) =>
          onAction({
            type: 'changeContactType',
            networkId,
            instructionId: instruction.id,
            contactType: event.target.value as 'normallyOpen' | 'normallyClosed',
          })
        }
      >
        <option value="normallyOpen">常开触点</option>
        <option value="normallyClosed">常闭触点</option>
      </select>
    </label>
  );
}
