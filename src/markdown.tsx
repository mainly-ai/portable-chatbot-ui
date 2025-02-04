import MarkdownToJSX from 'markdown-to-jsx'

export default function Markdown({ children }: { children: string }) {
	return <MarkdownToJSX options={{
		overrides: {
			code: {
				props: { className: "bg-slate-100 rounded-md p-2" },
			},
		},
	}}>{children}</MarkdownToJSX>
}
