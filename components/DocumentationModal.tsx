import React, { useState, useEffect } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
// FIX: Import correct exported icon wrappers and alias them to match component usage.
import { CloseIcon, BookOpen, Rocket, EditorViewIcon as LayoutDashboard, PackageIcon as Package, AiSuggestIcon as Wand2, CalculatorIcon as Calculator, DatabaseIcon as Database, Code, GiftIcon, SparklesIcon, AiSuggestIcon as Wand2Icon, CheckCircle2Icon as CheckCircle2, AuditLogIcon as History, TargetIcon, CameraIcon, AiRenameIcon, ElevatorLetterIcon, BugIcon } from './Icons';

interface DocumentationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const sections = {
    introduction: { title: 'Introduction', Icon: SparklesIcon },
    gettingStarted: { title: 'Getting Started', Icon: Rocket },
    editor: { title: 'Floorplan Editor', Icon: LayoutDashboard },
    equipment: { title: 'Equipment Management', Icon: Package },
    ai: { title: 'AI Features', Icon: Wand2 },
    tools: { title: 'Tools & Utilities', Icon: Calculator },
    data: { title: 'Data & Exports', Icon: Database },
    advanced: { title: 'Advanced Topics', Icon: Code },
    whatsnew: { title: 'What\'s New', Icon: GiftIcon },
};

type SectionKey = keyof typeof sections;

// --- STYLED CONTENT COMPONENTS ---
const H4: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h4 className="text-xl font-semibold text-primary-400 mt-8 mb-3">{children}</h4>
);
const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="leading-relaxed text-on-surface-variant mb-4">{children}</p>
);
const UL: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ul className="list-disc list-inside pl-4 space-y-2 my-4 text-on-surface-variant">{children}</ul>
);
const OL: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ol className="list-decimal list-inside pl-4 space-y-2 my-4 text-on-surface-variant">{children}</ol>
);
const Strong: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <strong className="font-semibold text-on-surface">{children}</strong>
);
const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <code className="bg-surface border border-white/10 px-1.5 py-0.5 rounded-md font-mono text-sm text-primary-300 mx-1">{children}</code>
);
// --- END STYLED CONTENT COMPONENTS ---

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section>
        <h3 className="text-3xl font-bold text-on-surface border-b-2 border-primary-600 pb-2 mb-6">{title}</h3>
        {children}
    </section>
);

const WhatsNewContent: React.FC = () => {
    const Feature: React.FC<{ Icon: React.ElementType; title: string; children: React.ReactNode }> = ({ Icon, title, children }) => (
        <div className="flex items-start gap-4 not-prose p-4 rounded-lg bg-surface border border-white/10">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-900/50 flex items-center justify-center mt-1 border border-primary-700">
                <Icon className="w-6 h-6 text-primary-400" />
            </div>
            <div>
                <h5 className="font-bold text-on-surface text-base">{title}</h5>
                <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{children}</p>
            </div>
        </div>
    );

    return (
        <Section title="What's New in Version 1.3">
             <div className="space-y-8">
                <section>
                    <H4>🚀 Major AI Upgrades</H4>
                    <div className="space-y-4">
                        <Feature Icon={TargetIcon} title="Smarter, More Accurate AI Placement">
                            The AI Suggestion feature is now significantly more precise. It correctly places card readers on walls next to doors and positions cameras in optimal locations, not just in the middle of rooms, saving you time on manual adjustments.
                        </Feature>
                        <Feature Icon={CameraIcon} title="AI-Suggested Camera Angles">
                            No more manual rotation for every new camera. When using AI Suggestions, cameras are now placed with a logical field of view (FOV) angle, aimed directly at their intended coverage area.
                        </Feature>
                        <Feature Icon={AiRenameIcon} title="AI Equipment Renaming">
                            Quickly name devices based on their location. Draw a box around a group of items, and the new AI Rename tool will read the room names and numbers from the floorplan to suggest accurate, consistent names for your equipment.
                        </Feature>
                    </div>
                </section>
                <section>
                    <H4>🛠️ New Tools & Workflows</H4>
                    <div className="space-y-4">
                        <Feature Icon={ElevatorLetterIcon} title="AI Elevator Specification Assistant">
                            Drastically reduce the time it takes to create detailed, professional elevator specification letters. Answer guided questions and let the AI generate a complete, formatted letter in <CodeBlock>.docx</CodeBlock> format.
                        </Feature>
                        <Feature Icon={CheckCircle2} title="Project Checklist">
                            Never miss a critical detail again. Our new comprehensive checklist guides you through every project phase, deriving answers from your floorplans and fueling a more accurate "AI Quote Analysis".
                        </Feature>
                         <Feature Icon={History} title="Full Audit Log">
                            Gain complete visibility into your project's history. See a time-stamped record of all major actions, from item creation to floorplan changes, tied to a unique user ID.
                        </Feature>
                    </div>
                </section>
                <section>
                    <H4>⚙️ Editor & Usability Improvements</H4>
                    <div className="space-y-4">
                        <Feature Icon={CameraIcon} title="Camera Field of View (FOV) Cones">
                            Visualize camera coverage directly on your floorplans! Cameras now display a configurable cone representing their field of view, helping you ensure complete and accurate surveillance design.
                        </Feature>
                        <Feature Icon={BugIcon} title="Reliability Boost & Bug Fixes">
                            We've squashed some major bugs, including fixing issues with PDF exports and SharePoint integration, for a smoother, more stable, and reliable floorplan editing experience.
                        </Feature>
                    </div>
                </section>
            </div>
        </Section>
    );
};

const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
    const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
    const [activeSection, setActiveSection] = useState<SectionKey>('introduction');
    const contentRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setActiveSection('introduction');
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);
    
    const handleSectionChange = (section: SectionKey) => {
        setActiveSection(section);
        contentRef.current?.scrollTo(0, 0);
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'introduction':
                return (
                    <Section title="Introduction to the Kastle Wizard">
                        <P>Welcome to the Kastle Wizard, your all-in-one tool for designing, managing, and delivering professional security system floor plans. This application is built to streamline the entire sales engineering workflow, from initial layout to final deliverable creation.</P>
                        <P>Leveraging powerful AI features and an intuitive, offline-first interface, the Kastle Wizard empowers you to work faster, reduce errors, and produce consistent, high-quality documentation for every project.</P>
                        <P>This documentation will guide you through every feature, from basic operations to advanced AI-powered workflows. Use the navigation on the left to jump to any topic.</P>
                    </Section>
                );
            case 'gettingStarted':
                return (
                    <Section title="Getting Started: Your First Project">
                        <H4>Step 1: Create a Project</H4>
                        <P>Everything starts with a project. From the welcome screen, click <Strong>Create New Project</Strong>. A new project will appear in the Project Explorer on the left, ready for you to rename and begin working on.</P>
                        <H4>Step 2: Add a Floorplan</H4>
                        <P>With your new project selected, click <Strong>Add Floorplan</Strong>. You have two options:</P>
                        <UL>
                            <li><Strong>Upload PDF/Image:</Strong> Select a <CodeBlock>PDF</CodeBlock>, <CodeBlock>JPG</CodeBlock>, or <CodeBlock>PNG</CodeBlock> file from your device. The app will process it and display it in the editor.</li>
                            <li><Strong>Take Photo:</Strong> Use your device's camera to take a picture of a physical floorplan. The app will convert the photo into a PDF page.</li>
                        </UL>
                        <H4>Step 3: Add Equipment</H4>
                        <P>Once your floorplan is loaded, use the main toolbar at the bottom of the screen. Click the <Strong>+ Add Item</Strong> button to open a menu of all available devices and markers. Select an item, then click on the floorplan to place it.</P>
                        <H4>Step 4: Edit Equipment Details</H4>
                        <P>Select any placed item on the floorplan. An <Strong>Edit Controls</Strong> panel will appear. Click <Strong>Edit</Strong> to open a detailed form where you can specify the item's location, model, settings, and add notes or photos.</P>
                        <H4>Step 5: Export Your Work</H4>
                        <P>When you're ready, use the <Strong>Menu</Strong> button in the top-right header to access export options. You can export the current floorplan as an annotated PDF, or generate a full <Strong>Deliverables Package</Strong> containing PDFs, an Excel equipment list, all project photos, and more.</P>
                    </Section>
                );
            case 'editor':
                return (
                    <Section title="The Floorplan Editor">
                        <H4>The Toolbar</H4>
                        <P>The main toolbar at the bottom provides all your essential tools:</P>
                        <UL>
                            <li><Strong>Select (<CodeBlock>V</CodeBlock>):</Strong> The default tool for selecting, moving, and resizing items.</li>
                            <li><Strong>Pan (<CodeBlock>H</CodeBlock>):</Strong> Click and drag to move your view of the floorplan.</li>
                            <li><Strong>Conduit/Draw/Rectangle:</Strong> Tools for creating annotations.</li>
                            <li><Strong>Add Item (+):</Strong> Opens the equipment catalog to add new devices/markers.</li>
                            <li><Strong>Place from Inventory:</Strong> Place items that exist in your project but are not yet on the current floorplan.</li>
                            <li><Strong>Zoom Controls:</Strong> Zoom in and out of the floorplan for precise work.</li>
                        </UL>
                        <H4>Manipulating Items</H4>
                        <P>With the <Strong>Select</Strong> tool, you can click an item to select it. Hold <CodeBlock>Ctrl/Cmd</CodeBlock> to select multiple items, or click and drag a box to select all items within it. Selected items can be moved, resized using the corner handles, and deleted. When a single item is selected, an <Strong>Edit Controls</Strong> panel appears with more options.</P>
                        <H4>Camera Field of View (FOV)</H4>
                        <P>When a single camera is selected, a blue cone representing its field of view is displayed. You can adjust it using the handles:</P>
                        <UL>
                            <li><Strong>Center Handle:</Strong> Drag to change both the distance and rotation (aim) of the camera's view.</li>
                            <li><Strong>Edge Handles:</Strong> Drag to widen or narrow the viewing angle.</li>
                        </UL>
                        <H4>Layers Panel & Legend</H4>
                        <P>On the top-right of the editor, you'll find the <Strong>Layers</Strong> panel and <Strong>Legend</Strong>. Use the <Strong>Layers</Strong> panel to toggle the visibility of different equipment types or the coordinate grid. The <Strong>Legend</Strong> automatically updates to show a count of all equipment currently visible on the page.</P>
                    </Section>
                );
            case 'equipment':
                 return (
                    <Section title="Equipment Management">
                        <H4>Equipment List View</H4>
                        <P>Accessed from the main header, the <Strong>Equipment</Strong> view provides a powerful table-based interface for managing all items in your project. You can sort, search, and filter your entire inventory here.</P>
                        <H4>Project vs. Floorplan Inventory</H4>
                        <UL>
                            <li><Strong>Project Level Inventory:</Strong> This is your master list of unplaced items. When you add a new device here, it's available to be placed on any floorplan.</li>
                            <li><Strong>Floorplan View:</Strong> When viewing the equipment list from a specific floorplan, you'll see all items placed on that floorplan, plus all items from the Project Level Inventory.</li>
                        </UL>
                        <H4>Bulk Editing</H4>
                        <P>A major time-saver! In the <Strong>Equipment List</Strong>, you can select multiple devices of the <Strong>same type</Strong> (e.g., three Dome Cameras). A <Strong>Bulk Edit</Strong> button will appear, allowing you to change properties for all selected items at once. Any field you change in the form will be applied to all selected devices.</P>
                        <H4>Moving Items</H4>
                        <P>You can move items between floorplans. Select one or more items in the list, click the <Strong>Move</Strong> button in the bulk actions bar, and choose the destination floorplan. This is useful for correcting mistakes or reorganizing large projects.</P>
                    </Section>
                );
            case 'ai':
                 return (
                    <Section title="AI Features">
                        <H4>AI Layout Suggestions</H4>
                        <P>Let the AI assist with your initial layout. Click the <Strong>AI Suggestions</Strong> button (magic wand icon) in the header. The workflow is:</P>
                        <OL>
                            <li><Strong>Configure:</Strong> Choose a security goal (e.g., Perimeter Security), select which equipment types you want the AI to place, and set optional min/max constraints. You can also customize the AI's instructions.</li>
                            <li><Strong>Define Area:</Strong> You will be prompted to draw a rectangle on your floorplan over the area you want the AI to analyze.</li>
                            <li><Strong>Review:</Strong> The AI will analyze the selected area and return a list of suggested placements with locations and justifications.</li>
                            <li><Strong>Accept & Place:</Strong> If you're happy with the suggestions, click "Accept & Place" to add them directly to your floorplan.</li>
                        </OL>
                        <H4>AI Quote Analysis</H4>
                        <P>This tool generates a professional, client-facing summary of the project scope, suitable for inclusion in quotes. It analyzes all project data, including the full equipment list and your answers from the <Strong>Project Checklist</Strong>. To use it, navigate to the <Strong>Checklist</Strong> view and click <Strong>Run AI Analysis</Strong>.</P>
                        <H4>AI Assistant</H4>
                        <P>The AI Assistant (sparkles icon in the header) provides a conversational interface for quickly adding equipment. It's designed to make data entry faster, especially during on-site surveys where typing can be cumbersome.</P>
                        <UL>
                            <li><Strong>Natural Language:</Strong> Simply tell the assistant what you need, like "Add an outdoor dome camera for the north parking lot entrance."</li>
                            <li><Strong>Intelligent Follow-up:</Strong> The AI knows the required fields for each device type. If you miss a detail, it will ask clarifying questions, such as "What type of lock hardware is on that door?"</li>
                            <li><Strong>Direct to Inventory:</Strong> Once all necessary information is gathered, the AI adds the fully configured item to your project's unplaced inventory, ready for you to drag onto a floorplan.</li>
                        </UL>
                        <H4>AI Elevator Specification Assistant</H4>
                        <P>This specialized tool, found in the main navigation, dramatically speeds up the creation of technical specification letters for elevator integrations. It provides a detailed form covering all aspects of an elevator system. Once you fill it out, the AI generates a complete, formally structured letter in <CodeBlock>.docx</CodeBlock> format, ready for download.</P>
                    </Section>
                );
            case 'tools':
                 return (
                    <Section title="Tools & Utilities">
                        <H4>Gateway Calculator</H4>
                        <P>Properly sizing a video system is critical. The <Strong>Gateway Calculator</Strong> helps you plan the required number and type of KastleVideo gateways. You can manually add camera streams or import them from your project's equipment list. The tool calculates the total load (streams, throughput, storage) and recommends a gateway configuration. You can then use the drag-and-drop interface to assign specific camera streams to each gateway for load balancing.</P>
                        <H4>Image Gallery</H4>
                        <P>This view provides a central location to see every photo attached to any device or marker across your entire project. It's a great way to quickly review site survey photos. You can group the images by the date they were added, by floorplan, or by equipment type.</P>
                        <H4>Project Checklist</H4>
                        <P>The checklist is a vital tool for ensuring project diligence and quality. It contains a comprehensive list of questions covering all aspects of a project, from scope to networking to client communication.</P>
                        <UL>
                            <li><Strong>Intelligent Auto-Answers:</Strong> The checklist is smart. It automatically derives answers to certain questions by analyzing your project data. For example, it can count how many elevators you've placed, determine if crash bars are in use, or identify the lock providers you've specified.</li>
                            <li><Strong>Feeds the AI:</Strong> Your answers provide crucial context for the <Strong>AI Quote Analysis</Strong> feature, enabling it to generate a more accurate and detailed project summary that highlights key assumptions and risks.</li>
                        </UL>
                    </Section>
                );
            case 'data':
                return (
                    <Section title="Data Management & Exports">
                        <H4>Project Files (<CodeBlock>.floorplan</CodeBlock>)</H4>
                        <P>This is the native, editable file format for the Kastle Wizard. It's a <CodeBlock>.zip</CodeBlock> archive containing all project data, inventory, checklist answers, and the original PDF floorplan files. Use this format to save your work, share with other Kastle Wizard users, or for archiving.</P>
                        <H4>Deliverables Package (<CodeBlock>.zip</CodeBlock>)</H4>
                        <P>This is a read-only package intended for project turnover or for sharing with clients and installers. It contains:</P>
                        <UL>
                            <li>Annotated PDFs for each floorplan.</li>
                            <li>A detailed Equipment List in Microsoft Excel (<CodeBlock>.xlsx</CodeBlock>) format.</li>
                            <li>A folder containing all project photos, organized by equipment type.</li>
                            <li>The AI Quote Analysis report (if generated).</li>
                            <li>A project Audit Log in CSV format.</li>
                        </UL>
                        <H4>Backup & Restore</H4>
                        <P>This is a powerful data safety feature. <Strong>Backup All Data</Strong> creates a single <CodeBlock>.zip</CodeBlock> file containing ALL projects currently in the application. <Strong>Restore from Backup</Strong> will completely overwrite all existing application data with the contents of the backup file. This is useful for migrating your work to a new computer.</P>
                        <H4>Auto-Backup</H4>
                        <P>This is your primary safety net against data loss. From the main menu, you can configure auto-backup by selecting a folder on your computer. As you work, the application will periodically and automatically save a full backup file (<CodeBlock>kastle-wizard-autosave.zip</CodeBlock>) to that location.</P>
                        <H4>SharePoint & Power Automate Integration</H4>
                        <P>For streamlined workflows, you can send your project files directly to a SharePoint folder using Microsoft Power Automate. This allows for automated archival and team notifications.</P>
                        <OL>
                            <li><Strong>Setup:</Strong> In the <Strong>Settings</Strong> menu, you'll find step-by-step instructions to create a "flow" in Power Automate. This flow generates a unique webhook URL.</li>
                            <li><Strong>Configure:</Strong> Paste this URL into the SharePoint Webhook URL field in the Kastle Wizard's settings.</li>
                            <li><Strong>Send:</Strong> From the main menu, choose <Strong>Send to SharePoint</Strong>. You can optionally select a Sales Engineer to notify. The app will upload both the Deliverables Package and the editable Project File to your Power Automate flow, which then saves them to your designated SharePoint folder and sends an email notification with download links.</li>
                        </OL>
                    </Section>
                );
            case 'advanced':
                return (
                    <Section title="Advanced Topics">
                        <H4>Admin Mode</H4>
                        <P>Toggled from the main menu, <Strong>Admin Mode</Strong> unlocks advanced customization for power users. When enabled, you can edit the device configuration forms:</P>
                        <UL>
                            <li><Strong>Hide/Show Fields:</Strong> Click the eye icon next to a field name to toggle its visibility.</li>
                            <li><Strong>Reorder Fields:</Strong> Drag and drop fields using the grip handle to change their order in the form.</li>
                            <li><Strong>Edit Dropdown Options:</Strong> Add or remove options from select/dropdown menus.</li>
                        </UL>
                        <P>These customizations are saved locally in your browser and will persist for all projects.</P>
                        <H4>Audit Log</H4>
                        <P>The <Strong>Audit Log</Strong> view provides a detailed, chronological record of every significant action taken within a project. It tracks item creation, deletion, name changes, checklist updates, and more. Each entry is stamped with the date, time, and a unique (but anonymous) user ID stored in your browser. This provides complete traceability and accountability for project changes.</P>
                    </Section>
                );
            case 'whatsnew':
                return <WhatsNewContent />;
            default:
                return null;
        }
    };
    
    if (!isOpen) return null;

    return (
        <div ref={modalRef} className="fixed inset-0 bg-black/70 z-[120] flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="documentation-title">
            <div className="bg-surface rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-white/10 flex justify-between items-center flex-shrink-0">
                    <h2 id="documentation-title" className="text-xl font-bold text-on-surface flex items-center gap-2"><BookOpen className="w-6 h-6 text-primary-400" /> App Documentation</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>
                <div className="flex-1 flex min-h-0">
                    <nav className="w-64 border-r border-white/10 p-4 overflow-y-auto flex-shrink-0" aria-label="Documentation sections">
                        <ul className="space-y-1">
                            {Object.entries(sections).map(([key, { title, Icon }]) => (
                                <li key={key}>
                                    <button
                                        onClick={() => handleSectionChange(key as SectionKey)}
                                        aria-current={activeSection === key ? 'page' : undefined}
                                        className={`w-full text-left flex items-center gap-3 p-2 rounded-md text-sm transition-colors ${activeSection === key ? 'bg-primary-600 text-white font-semibold' : 'text-on-surface-variant font-medium hover:bg-white/10'}`}
                                    >
                                        <Icon className="w-5 h-5 flex-shrink-0" />
                                        <span>{title}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    <main ref={contentRef} className="flex-1 overflow-y-auto p-8" role="document">
                        {renderContent()}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default DocumentationModal;