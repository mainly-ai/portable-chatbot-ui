import { useState, useEffect } from "react"
import "./Chat.css" // Reuse existing styles or add new ones if needed

export function SidebarImage({ src, width, align }: { src: string, width?: string, align: "left" | "right" }) {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false)
            }
        }
        window.addEventListener("keydown", handleEsc)
        return () => window.removeEventListener("keydown", handleEsc)
    }, [])

    const toggleOpen = () => setIsOpen(!isOpen)

    return (
        <>
            <div className={`absolute top-1/2 -translate-y-1/2 z-10 touch-none ${align === "left" ? "left-4" : "right-4"}`}>
                {/* pointer-events-auto is needed because parent might be pointer-events-none in some contexts, though here we control the div */}
                {/* The user issue about width: ensure width style has precedence. using 'width' style property directly if passed, but typically CSS width. */}
                {/* If width is passed (e.g. "500px"), we set it as style width. We also keep max-width constraints for safety unless overridden. */}
                <img
                    src={src}
                    className="max-h-[80vh] object-contain rounded-xl shadow-lg cursor-pointer transition-transform hover:scale-105"
                    alt={`sidebar ${align}`}
                    style={{
                        width: width ? width : undefined,
                        maxWidth: width ? 'none' : '300px' // If width is specified, we uncap the default 300px limit, but maybe we should keep a reasonable max? User said "biting fully", implies they want it to be that size.
                    }}
                    onClick={toggleOpen}
                />
            </div>

            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8"
                    onClick={() => setIsOpen(false)}
                >
                    <img
                        src={src}
                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                        alt={`sidebar ${align} full`}
                        style={{ cursor: "zoom-out" }}
                    />
                </div>
            )}
        </>
    )
}
