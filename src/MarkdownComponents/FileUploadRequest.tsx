import { CheckCircleIcon, Loader2Icon } from "lucide-react"
import { useRef, useState } from "react"

export default function FileUploadRequest({ mimeType, label }: { mimeType: string, label: string }) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [file, setFile] = useState<File | null>(null)
	const [isUploading, setIsUploading] = useState(false)
	const [isDraggingOver, setIsDraggingOver] = useState(false)
	
	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setIsUploading(true)
		setFile(e.target.files?.[0] ?? null)
		setTimeout(() => {
			setIsUploading(false)
		}, 1000)
	}

	return (
		<form 
			className="flex flex-col gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50 w-72 cursor-pointer focus:outline-2 focus:outline-offset-2 focus:outline-black"
			tabIndex={1}
			onClick={() => {
				inputRef.current?.click()
			}}
			onDragOver={(e) => {
				e.preventDefault();
				e.stopPropagation();
				setIsDraggingOver(true);
			}}
			onDragLeave={(e) => {
				e.preventDefault();
				e.stopPropagation();
				setIsDraggingOver(false);
			}}
			onDrop={(e) => {
				e.preventDefault();
				e.stopPropagation();
				setIsDraggingOver(false);
				const droppedFile = e.dataTransfer.files[0];
				if (droppedFile && droppedFile.type.match(mimeType)) {
					setIsUploading(true)
					setFile(droppedFile);
					setTimeout(() => {
						setIsUploading(false)
					}, 1000)
				}
			}}
		>
			<div className="flex flex-col gap-2 pointer-events-auto">
				<label className="text-sm font-medium text-center text-gray-700 mb-1">{label}</label>
				<div className="relative h-32">
					<input 
						type="file" 
						accept={mimeType} 
						onChange={onChange}
						className="hidden"
						ref={inputRef}
					/>
					<div 
						className={`absolute inset-0 pointer-events-none border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors duration-200 ${
							isDraggingOver 
								? "border-blue-500 bg-blue-50" 
								: "border-gray-300 hover:border-gray-400"
						}`}
					>
						{file 
						? (
							<div className="flex items-center justify-center gap-2 w-full px-4">
								{isUploading ? (
									<Loader2Icon className="text-blue-500 shrink-0 animate-spin" />
								) : (
									<CheckCircleIcon className="text-green-500 shrink-0" />
								)}
								<span className="text-sm text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">{file.name}</span>
							</div>
						) : (
							<span className={`text-sm transition-colors duration-200 ${
							isDraggingOver ? "text-blue-600" : "text-gray-500"
						}`}>
							{isDraggingOver ? "Drop file here" : "Drop files here or click to upload"}
						</span>
						)}
					</div>
				</div>
			</div>
			{/* <button 
				type="submit"
				className="inline-flex justify-center py-2 px-4 cursor-pointer
					text-sm font-medium rounded-full text-white bg-black 
					hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 
					focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={!file}
			>
				Upload
			</button> */}
		</form>
	)
}

// <ProgressBar label="Hello World" value={33} /> 