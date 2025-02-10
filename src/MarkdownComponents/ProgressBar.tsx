export default function ProgressBar({ label, value, max = 100 }: { label: string, value: number, max?: number }) {
	return (
		<div className="w-full min-w-md flex flex-col items-center gap-2">
			<div className="bg-gray-200 rounded-full h-4 w-full">
				<div className="bg-blue-500 h-4 rounded-full" style={{ width: `${value / max * 100}%` }} />
			</div>
			<div className="text-sm text-gray-500 flex gap-2 items-center">
				<span>{label}</span>
				<span>{max === 100 ? `${value}%` : `${value}/${max}`}</span>
			</div>
		</div>
	)
}

// <ProgressBar label="Hello World" value={33} /> 