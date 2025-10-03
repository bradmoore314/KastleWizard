
import React, { useState, useEffect, useMemo } from 'react';
import { Project, ChecklistQuestion, CameraData } from '../types';
import { useAppDispatch } from '../state/AppContext';
import { ALL_QUESTIONS, CHECKLIST_CATEGORIES, ENHANCED_QUESTIONS, getAIAutofillSuggestions } from '../services/questions';
import { ChevronDown, SparklesIcon, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChecklistProps {
    project: Project;
    onRunAnalysis: () => void;
    isAnalyzing: boolean;
}

interface QuestionInputProps {
    question: ChecklistQuestion;
    value: any;
    derivedValue: any;
    onChange: (value: any) => void;
}

const QuestionInput: React.FC<QuestionInputProps> = ({ question, value, derivedValue, onChange }) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    if (derivedValue !== undefined) {
        return (
            <div className="flex items-center gap-2 p-2 bg-background rounded-md text-on-surface-variant">
                <SparklesIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <span className="text-sm font-medium italic">{String(derivedValue)}</span>
            </div>
        );
    }
    
    const { options } = question;

    if (options?.every(opt => ['Yes', 'No', 'Unknown', 'N/A'].includes(opt))) {
        return (
            <div className="flex flex-wrap gap-1 sm:gap-2">
                {options.map(opt => (
                     <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${value === opt ? 'bg-primary-600 text-white' : 'bg-background hover:bg-white/10'}`}
                     >
                         {opt}
                     </button>
                ))}
            </div>
        );
    }

    if (options) {
        return (
            <select
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                className="w-full max-w-xs bg-background border border-white/20 rounded-md p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
            >
                <option value="">-- Select --</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        );
    }

    return (
        <textarea
            value={localValue || ''}
            onChange={e => setLocalValue(e.target.value)}
            onBlur={() => onChange(localValue)}
            rows={2}
            className="w-full bg-background border border-white/20 rounded-md p-2 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
        />
    );
};

interface CategorySectionProps {
    categoryKey: string;
    project: Project;
    questions: ChecklistQuestion[];
    initialOpen: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({ categoryKey, project, questions, initialOpen }) => {
    const dispatch = useAppDispatch();
    const [isOpen, setIsOpen] = useState(initialOpen);

    const category = CHECKLIST_CATEGORIES.find(c => c.key === categoryKey);
    const answers = project.checklistAnswers;

    const handleAnswerChange = (questionId: string, answer: any) => {
        dispatch({ type: 'UPDATE_CHECKLIST_ANSWER', payload: { questionId, answer } });
    };

    if (!category || questions.length === 0) return null;

    return (
        <div className="bg-surface rounded-xl border border-white/10">
            <button
                className="w-full flex justify-between items-center p-2 sm:p-4 text-left"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 sm:gap-3">
                    <span>{category.icon}</span>
                    {category.title}
                </h2>
                <ChevronDown className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-2 sm:p-4 border-t border-white/10 space-y-2 sm:space-y-4">
                    {questions.map(q => {
                        const derivedValue = q.derivation ? q.derivation(project) : undefined;
                        
                        return (
                            <div key={q.id} className="grid md:grid-cols-2 gap-2 sm:gap-4 items-start border-b border-white/5 pb-2 sm:pb-4 last:border-b-0 last:pb-0">
                                <div className="text-on-surface-variant">
                                    <p className="font-semibold text-on-surface text-sm sm:text-base">{q.text}</p>
                                    <p className="text-xs mt-1">Assigned to: {q.assignedTo}</p>
                                </div>
                                <div>
                                    <QuestionInput
                                        question={q}
                                        value={answers[q.id]}
                                        derivedValue={derivedValue}
                                        onChange={(answer) => handleAnswerChange(q.id, answer)}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const Checklist: React.FC<ChecklistProps> = ({ project, onRunAnalysis, isAnalyzing }) => {
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'unanswered', 'answered'
    const [assigneeFilter, setAssigneeFilter] = useState('all');
    const [isAutofilling, setIsAutofilling] = useState(false);

    const assignees = useMemo(() => {
        const all = new Set(ALL_QUESTIONS.map(q => q.assignedTo));
        return ['all', ...Array.from(all).sort()];
    }, []);

    const hasTakeoverCamera = useMemo(() => {
        if (!project) return false;
        const allInventory = [...project.projectLevelInventory, ...project.floorplans.flatMap(fp => fp.inventory)];
        return allInventory.some(item => 
            item.type === 'device' && 
            item.deviceType === 'camera' && 
            (item.data as CameraData).install_type === 'Takeover'
        );
    }, [project]);

    const handleAIAutofill = async () => {
        if (!import.meta.env.VITE_API_KEY) {
            toast.error('AI Autofill requires an API key to be configured.');
            return;
        }

        setIsAutofilling(true);
        try {
            const suggestions = await getAIAutofillSuggestions(project, import.meta.env.VITE_API_KEY);
            
            if (Object.keys(suggestions).length === 0) {
                toast('No additional questions could be auto-filled based on current project data.', {
                    icon: 'ℹ️',
                    duration: 4000,
                });
                return;
            }

            // Apply suggestions to project
            const updates: Record<string, string> = {};
            Object.entries(suggestions).forEach(([questionId, answer]) => {
                if (!project.checklistAnswers[questionId]) {
                    updates[questionId] = answer;
                }
            });

            if (Object.keys(updates).length > 0) {
                dispatch({ 
                    type: 'UPDATE_CHECKLIST', 
                    payload: { 
                        projectId: project.id, 
                        answers: updates 
                    } 
                });
                
                toast.success(`AI auto-filled ${Object.keys(updates).length} questions!`, {
                    icon: '🤖',
                    duration: 4000,
                });
            } else {
                toast('All questions that could be auto-filled are already answered.', {
                    icon: '✅',
                    duration: 3000,
                });
            }
        } catch (error) {
            console.error('AI Autofill error:', error);
            toast.error('Failed to auto-fill questions. Please try again.');
        } finally {
            setIsAutofilling(false);
        }
    };

    const filteredQuestions = useMemo(() => {
        return ENHANCED_QUESTIONS.filter(q => {
            // Branching logic: show child only if parent has the correct value
            if (q.branchingCondition) {
                const parentAnswer = project.checklistAnswers[q.branchingCondition.questionId];
                if (parentAnswer !== q.branchingCondition.value) return false;
            }
    
            // Contextual logic: only show elevator questions if elevators exist
            if (q.categoryKey === 'elevator') {
                const hasElevator = project.floorplans.flatMap(fp => fp.inventory).some(e => e.type === 'device' && e.deviceType === 'elevator');
                if (!hasElevator) return false;
            }

            // Contextual logic: only show video takeover questions if a takeover camera exists
            if (q.categoryKey === 'video' && !hasTakeoverCamera) {
                return false;
            }
    
            // Status filter
            const hasManualAnswer = project.checklistAnswers[q.id] !== undefined && project.checklistAnswers[q.id] !== null && project.checklistAnswers[q.id] !== '';
            
            const derivedValue = q.derivation ? q.derivation(project) : undefined;
            const hasDerivedAnswer = derivedValue !== undefined && derivedValue !== null && String(derivedValue).trim() !== '';

            const isAnswered = hasManualAnswer || hasDerivedAnswer;

            if (statusFilter === 'unanswered' && isAnswered) return false;
            if (statusFilter === 'answered' && !isAnswered) return false;
    
            // Assignee filter
            if (assigneeFilter !== 'all' && q.assignedTo !== assigneeFilter) return false;
            
            return true;
        });
    }, [project, statusFilter, assigneeFilter, hasTakeoverCamera]);

    return (
        <div className="w-full h-full p-2 sm:p-4 md:p-8 overflow-y-auto text-on-surface scrolling-touch bg-background">
            <div className="max-w-4xl mx-auto">
                 <div className="flex flex-col md:flex-row justify-between md:items-center mb-2 sm:mb-4 gap-2 sm:gap-4">
                    <div>
                        <h1 className="text-xl sm:text-3xl md:text-4xl font-bold">Project Checklist</h1>
                        <p className="text-sm sm:text-md md:text-lg text-on-surface-variant mt-1 sm:mt-2">
                            A comprehensive list of questions to ensure project success.
                        </p>
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                        <button
                            onClick={handleAIAutofill}
                            disabled={isAutofilling}
                            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start md:self-center text-xs sm:text-sm"
                            title="AI Auto-fill Checklist Questions"
                        >
                            {isAutofilling ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <Wand2 className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">AI Auto-fill</span>
                            <span className="sm:hidden">Auto-fill</span>
                        </button>
                        <button
                            onClick={onRunAnalysis}
                            disabled={isAnalyzing}
                            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-surface text-on-surface rounded-lg hover:bg-white/10 transition-colors border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed self-start md:self-center text-xs sm:text-sm"
                            title="Run AI Quote Analysis"
                        >
                            {isAnalyzing ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                            ) : (
                                <SparklesIcon className="w-5 h-5 text-yellow-400" />
                            )}
                            <span>{isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-surface border border-white/10 rounded-xl">
                    <div className="flex-1">
                        <label className="text-sm font-medium text-on-surface-variant mb-2 block">Filter by Status</label>
                        <div className="flex items-center gap-1 bg-background rounded-lg p-1">
                            <button onClick={() => setStatusFilter('all')} className={`flex-1 py-1.5 px-3 rounded-md text-sm transition-colors ${statusFilter === 'all' ? 'bg-primary-600 text-white' : 'hover:bg-white/10'}`}>All</button>
                            <button onClick={() => setStatusFilter('unanswered')} className={`flex-1 py-1.5 px-3 rounded-md text-sm transition-colors ${statusFilter === 'unanswered' ? 'bg-primary-600 text-white' : 'hover:bg-white/10'}`}>Unanswered</button>
                            <button onClick={() => setStatusFilter('answered')} className={`flex-1 py-1.5 px-3 rounded-md text-sm transition-colors ${statusFilter === 'answered' ? 'bg-primary-600 text-white' : 'hover:bg-white/10'}`}>Answered</button>
                        </div>
                    </div>
                    <div className="flex-1">
                        <label htmlFor="assignee-filter" className="text-sm font-medium text-on-surface-variant mb-2 block">Filter by Assignee</label>
                        <select id="assignee-filter" value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)} className="w-full bg-background border border-white/20 rounded-lg p-2.5 text-on-surface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition">
                            {assignees.map(assignee => (
                                <option key={assignee} value={assignee}>{assignee === 'all' ? 'All Assignees' : assignee}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-6">
                    {CHECKLIST_CATEGORIES.map(category => {
                        const questionsForCategory = filteredQuestions.filter(q => q.categoryKey === category.key);
                        if (questionsForCategory.length === 0) return null;

                        return (
                            <CategorySection 
                                key={category.key} 
                                categoryKey={category.key}
                                project={project}
                                questions={questionsForCategory}
                                initialOpen={category.key !== 'general'}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Checklist;
