import React from 'react';
// FIX: Import Bug and Lightbulb icons from lucide-react.
// FIX: Import Target and ChevronsRight for use in other components.
// FIX: Aliased icon imports to prevent naming conflicts with exported components.
import { MousePointer2, Type, Image, PenLine, Trash2, Download, UploadCloud, ZoomIn, ZoomOut, RotateCw, Square, Undo2, Redo2, Copy, SendToBack, BringToFront, KeyRound, Video, Pencil, Building2, PhoneCall, ShieldCheck, BoxSelect, ListChecks, LayoutDashboard, PackagePlus, PlusCircle, FileSpreadsheet, FileUp, FileDown, Menu, X, MoreVertical, Database, DatabaseBackup, Settings, Eye, EyeOff, GripVertical, FileJson, Package, Sparkles, Server, Router, Wifi, AlertTriangle, MonitorPlay, PanelTop, HardDrive, Network, Mic, MicOff, Volume2, VolumeX, SendHorizontal, Repeat, Check, ChevronDown, Scaling, Shield, Hand, GalleryHorizontal, Palette, Calculator, HelpCircle, Wand2, Waves, Speaker, Search, MessageSquare, Bug, Lightbulb, FileText, History, Waypoints as WaypointsIcon, Target, ChevronsRight, Gift, CheckCircle2, Grid, BookOpen as BookOpenIcon, Rocket as RocketIcon, Code as CodeIcon, Cable as CableIcon, ScanText, ArrowRight } from 'lucide-react';

export const SelectIcon = (props: React.SVGProps<SVGSVGElement>) => <MousePointer2 {...props} />;
export const PanIcon = (props: React.SVGProps<SVGSVGElement>) => <Hand {...props} />;
export const TextIcon = (props: React.SVGProps<SVGSVGElement>) => <Type {...props} />;
export const ImageIcon = (props: React.SVGProps<SVGSVGElement>) => <Image {...props} />;
export const DrawIcon = (props: React.SVGProps<SVGSVGElement>) => <PenLine {...props} />;
export const RectangleIcon = (props: React.SVGProps<SVGSVGElement>) => <Square {...props} />;
export const ConduitIcon = (props: React.SVGProps<SVGSVGElement>) => <WaypointsIcon {...props} />;
export const PaletteIcon = (props: React.SVGProps<SVGSVGElement>) => <Palette {...props} />;

export const EditDataIcon = (props: React.SVGProps<SVGSVGElement>) => <Pencil {...props} />;
export const PencilIcon = (props: React.SVGProps<SVGSVGElement>) => <Pencil {...props} />;
export const DeleteIcon = (props: React.SVGProps<SVGSVGElement>) => <Trash2 {...props} />;
export const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => <Download {...props} />;
export const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => <UploadCloud {...props} />;
export const ZoomInIcon = (props: React.SVGProps<SVGSVGElement>) => <ZoomIn {...props} />;
export const ZoomOutIcon = (props: React.SVGProps<SVGSVGElement>) => <ZoomOut {...props} />;
export const RotateIcon = (props: React.SVGProps<SVGSVGElement>) => <RotateCw {...props} />;
export const SameSizeIcon = (props: React.SVGProps<SVGSVGElement>) => <BoxSelect {...props} />;
export const ListViewIcon = (props: React.SVGProps<SVGSVGElement>) => <ListChecks {...props} />;
export const EditorViewIcon = (props: React.SVGProps<SVGSVGElement>) => <LayoutDashboard {...props} />;
export const PlaceFromInventoryIcon = (props: React.SVGProps<SVGSVGElement>) => <PackagePlus {...props} />;
export const AddIcon = (props: React.SVGProps<SVGSVGElement>) => <PlusCircle {...props} />;
export const ExportIcon = (props: React.SVGProps<SVGSVGElement>) => <FileSpreadsheet {...props} />;
export const ImportIcon = (props: React.SVGProps<SVGSVGElement>) => <FileUp {...props} />;
export const ExportProjectIcon = (props: React.SVGProps<SVGSVGElement>) => <FileDown {...props} />;
export const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => <Menu {...props} />;
export const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => <X {...props} />;
export const MoreVerticalIcon = (props: React.SVGProps<SVGSVGElement>) => <MoreVertical {...props} />;
export const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => <Search {...props} />;

export const UndoIcon = (props: React.SVGProps<SVGSVGElement>) => <Undo2 {...props} />;
export const RedoIcon = (props: React.SVGProps<SVGSVGElement>) => <Redo2 {...props} />;
export const CopyIcon = (props: React.SVGProps<SVGSVGElement>) => <Copy {...props} />;
export const SendToBackIcon = (props: React.SVGProps<SVGSVGElement>) => <SendToBack {...props} />;
export const BringToFrontIcon = (props: React.SVGProps<SVGSVGElement>) => <BringToFront {...props} />;
export const DatabaseIcon = (props: React.SVGProps<SVGSVGElement>) => <Database {...props} />;
export const DatabaseBackupIcon = (props: React.SVGProps<SVGSVGElement>) => <DatabaseBackup {...props} />;
export const FileUpIcon = (props: React.SVGProps<SVGSVGElement>) => <FileUp {...props} />;
export const FileDownIcon = (props: React.SVGProps<SVGSVGElement>) => <FileDown {...props} />;
export const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => <Check {...props} />;
export const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => <ChevronDown {...props} />;
export const ScalingIcon = (props: React.SVGProps<SVGSVGElement>) => <Scaling {...props} />;
export const ShieldIcon = (props: React.SVGProps<SVGSVGElement>) => <Shield {...props} />;
export const GalleryHorizontalIcon = (props: React.SVGProps<SVGSVGElement>) => <GalleryHorizontal {...props} />;


export const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => <Settings {...props} />;
export const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => <Eye {...props} />;
export const EyeOffIcon = (props: React.SVGProps<SVGSVGElement>) => <EyeOff {...props} />;
export const GripVerticalIcon = (props: React.SVGProps<SVGSVGElement>) => <GripVertical {...props} />;
export const FileJsonIcon = (props: React.SVGProps<SVGSVGElement>) => <FileJson {...props} />;
export const PackageIcon = (props: React.SVGProps<SVGSVGElement>) => <Package {...props} />;
export const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => <Sparkles {...props} />;

// Helper to create circle icons with text, similar to PDF export
const createPdfStyleIcon = (initials: string): React.FC<React.SVGProps<SVGSVGElement>> => {
  const Component: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="12" fill="currentColor" />
      <text
        x="12"
        y="12"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="white"
        fontSize="12"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        {initials}
      </text>
    </svg>
  );
  Component.displayName = `PdfStyleIcon(${initials})`;
  return Component;
};

// Device Icons
export const AccessDoorIcon = createPdfStyleIcon('CR');
export const CameraIcon = (props: React.SVGProps<SVGSVGElement>) => <Video {...props} />;
export const ElevatorIcon = (props: React.SVGProps<SVGSVGElement>) => <Building2 {...props} />;
export const IntercomIcon = (props: React.SVGProps<SVGSVGElement>) => <PhoneCall {...props} />;
export const TurnstileIcon = (props: React.SVGProps<SVGSVGElement>) => <Repeat {...props} />;
// FIX: Export KeyRoundIcon for use in AiSuggestModal
export const KeyRoundIcon = (props: React.SVGProps<SVGSVGElement>) => <KeyRound {...props} />;

// Marker Icons
export const AcHeadendIcon = (props: React.SVGProps<SVGSVGElement>) => <Server {...props} />;
export const VideoGatewayIcon = (props: React.SVGProps<SVGSVGElement>) => <Router {...props} />;
export const UbiquitiWirelessIcon = (props: React.SVGProps<SVGSVGElement>) => <Wifi {...props} />;
export const PanicButtonIcon = (props: React.SVGProps<SVGSVGElement>) => <AlertTriangle {...props} />;
export const ViewingStationIcon = (props: React.SVGProps<SVGSVGElement>) => <MonitorPlay {...props} />;
export const ExistingNvrIcon = (props: React.SVGProps<SVGSVGElement>) => <HardDrive {...props} />;
export const ExistingPanelIcon = (props: React.SVGProps<SVGSVGElement>) => <PanelTop {...props} />;
export const SwitchIcon = (props: React.SVGProps<SVGSVGElement>) => <Network {...props} />;
export const PointToPointIcon = (props: React.SVGProps<SVGSVGElement>) => <Waves {...props} />;
export const SpeakerIcon = (props: React.SVGProps<SVGSVGElement>) => <Volume2 {...props} />;

// AI Assistant Icons
export const MicIcon = (props: React.SVGProps<SVGSVGElement>) => <Mic {...props} />;
export const MicOffIcon = (props: React.SVGProps<SVGSVGElement>) => <MicOff {...props} />;
export const Volume2Icon = (props: React.SVGProps<SVGSVGElement>) => <Volume2 {...props} />;
export const VolumeXIcon = (props: React.SVGProps<SVGSVGElement>) => <VolumeX {...props} />;
export const SendIcon = (props: React.SVGProps<SVGSVGElement>) => <SendHorizontal {...props} />;
export const AiSuggestIcon = (props: React.SVGProps<SVGSVGElement>) => <Wand2 {...props} />;
// FIX: Export TargetIcon for use in AiSuggestModal
export const TargetIcon = (props: React.SVGProps<SVGSVGElement>) => <Target {...props} />;
export const AiRenameIcon = (props: React.SVGProps<SVGSVGElement>) => <ScanText {...props} />;
export const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => <ArrowRight {...props} />;

// Gateway Calculator Icons
export const CalculatorIcon = (props: React.SVGProps<SVGSVGElement>) => <Calculator {...props} />;
export const HelpCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <HelpCircle {...props} />;
export const FeedbackIcon = (props: React.SVGProps<SVGSVGElement>) => <MessageSquare {...props} />;
// FIX: Export BugIcon and LightbulbIcon for use in the feedback modal.
export const BugIcon = (props: React.SVGProps<SVGSVGElement>) => <Bug {...props} />;
export const LightbulbIcon = (props: React.SVGProps<SVGSVGElement>) => <Lightbulb {...props} />;
// FIX: Export ChevronsRightIcon for use in GatewayCalculator
export const ChevronsRightIcon = (props: React.SVGProps<SVGSVGElement>) => <ChevronsRight {...props} />;

// Documentation & What's New Icons
export const GiftIcon = (props: React.SVGProps<SVGSVGElement>) => <Gift {...props} />;
export const CheckCircle2Icon = (props: React.SVGProps<SVGSVGElement>) => <CheckCircle2 {...props} />;
// FIX: Use aliased icon imports to avoid naming collisions.
export const BookOpen = (props: React.SVGProps<SVGSVGElement>) => <BookOpenIcon {...props} />;
export const Rocket = (props: React.SVGProps<SVGSVGElement>) => <RocketIcon {...props} />;
export const Code = (props: React.SVGProps<SVGSVGElement>) => <CodeIcon {...props} />;
export const Cable = (props: React.SVGProps<SVGSVGElement>) => <CableIcon {...props} />;


// Grid Icon
export const GridIcon = (props: React.SVGProps<SVGSVGElement>) => <Grid {...props} />;


// Elevator Letter Icon
export const ElevatorLetterIcon = (props: React.SVGProps<SVGSVGElement>) => <FileText {...props} />;
export const Building = (props: React.SVGProps<SVGSVGElement>) => <Building2 {...props} />;
export const Waypoints = (props: React.SVGProps<SVGSVGElement>) => <WaypointsIcon {...props} />;


// Audit Log Icon
export const AuditLogIcon = (props: React.SVGProps<SVGSVGElement>) => <History {...props} />;


// App Logo
export const Logo: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={`relative ${className}`}>
            <ShieldIcon className="w-full h-full text-primary-600" fill="currentColor" />
            <span className="absolute inset-0 flex items-center justify-center text-white font-bold" style={{ fontSize: '75%' }}>
                K
            </span>
        </div>
    );
};