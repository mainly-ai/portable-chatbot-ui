import React, { Suspense } from 'react';
import MarkdownRenderer, { RuleType, MarkdownToJSX } from 'markdown-to-jsx'

const Highlight = React.lazy(async () => await import('react-highlight'))
const TeX = React.lazy(async () => await import('@matejmazur/react-katex'))

import './highlight.css'
import 'katex/dist/katex.min.css';
import type { KatexOptions } from 'katex';

const latexOptions: KatexOptions = {
	displayMode: true,
	strict: "ignore",
	throwOnError: false,
	fleqn: true,
};

function LatexRenderer({ text }: { text: string }) {
	const t = text
	return (
		<Suspense fallback={null}>
			<TeX block className="text-left" settings={latexOptions}>{String.raw`${t}`}</TeX>
		</Suspense>
	)
}

function CodeRenderer({ className, content }: { className: string; content: string }) {
	return (
		<Suspense fallback={<code className={className}>{content}</code>}>
			<Highlight className={className}>
				{content}
			</Highlight>
		</Suspense>
	);
}

function renderRule(next: () => React.ReactNode, node: MarkdownToJSX.ParserResult, _renderChildren: MarkdownToJSX.RuleOutput, _state: MarkdownToJSX.State) {
	console.log("renderRule", node)
	if (node.type === RuleType.codeBlock && node.lang === 'latex') {
		return <LatexRenderer text={node.text} />
	}
	if (node.type === RuleType.codeBlock && node.lang) {
		return <CodeRenderer content={String.raw`${node.text}`} className={`bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-300 px-3 py-2 whitespace-pre-wrap language-${node.lang} ${node.text.includes('\n') ? 'block' : ''}`} />
	}

	return next()
}

const markdownOptions: MarkdownToJSX.Options = {
	renderRule,
	overrides: {
		h1: {
			component: 'h1',
			props: {
				className: 'text-lg font-bold mb-1'
			}
		},
		h2: {
			component: 'h2',
			props: {
				className: 'text-base font-semibold mb-1'
			}
		},
		ul: {
			component: 'ul',
			props: {
				className: 'list-disc ml-4 mb-2'
				}
		},
		ol: {
			component: 'ol',
			props: {
				className: 'list-decimal ml-4 mb-2'
			}
		},
		table: {
			component: 'table',
			props: {
				className: 'min-w-full divide-y divide-gray-200'
			}
		},
		thead: {
			component: 'thead',
			props: {
				className: 'bg-gray-50'
			}
		},
		tbody: {
			component: 'tbody',
			props: {
				className: 'bg-white divide-y divide-gray-200'
			}
		},
		tr: {
			component: 'tr',
			props: {
				className: ''
			}
		},
		th: {
			component: 'th',
			props: {
				className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
			}
		},
		td: {
			component: 'td',
			props: {
				className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900'
			}
		},
	},
}

export default function Markdown({ children }: { children: string }) {
	return <MarkdownRenderer options={markdownOptions}>{children}</MarkdownRenderer>
}
