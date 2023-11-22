import type WiresockStateModel from '../models/WiresockStateModel'

interface LogsProps {
  wiresockState: WiresockStateModel
}

function Logs({ wiresockState }: LogsProps): JSX.Element {
  const listItems = Object.keys(wiresockState.logs)

  return (
    <div className="flex flex-col space-y-4">
      <ul role="list" className="space-y-4">
        {/* Mutate the list so we can reverse it */}
        {[...listItems].reverse().map((item: any, index) => (
          <li key={index} className="relative flex gap-x-4">
            <div className="relative flex h-6 w-6 flex-none items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full ring-1 ring-gray-500" />
            </div>
            <p className="flex-auto py-0.5 text-xs leading-5 text-gray-500">
              <span className="font-medium text-gray-900">{wiresockState.logs[item]}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Logs
