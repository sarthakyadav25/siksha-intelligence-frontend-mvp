import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { SidebarSubjects } from './SidebarSubjects';
import { SidebarTeachers } from './SidebarTeachers';
import { TimetableGrid } from './TimetableGrid';
import { setSubjectToCell, setTeacherToCell, resetGrid } from '../store/timetableSlice';
import type { RootState } from '@/store/store';
import type { Subject, Teacher } from '../types';
import { ArrowLeft, Save, Send, RotateCcw } from 'lucide-react';
import { useState } from 'react';

export function TimetableEditor() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { selectedClass, selectedSection, grid } = useSelector(
        (state: RootState) => state.timetable
    );
    const [activeDragItem, setActiveDragItem] = useState<{ type: string; item: Subject | Teacher } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        const data = active.data.current as { type: string; item: Subject | Teacher } | undefined;
        if (data) {
            setActiveDragItem(data);
        }
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        const dragData = active.data.current as { type: string; item: Subject | Teacher; targetCellKey?: string } | undefined;
        const dropData = over.data.current as { cellKey: string; status: string } | undefined;

        if (!dragData || !dropData) return;

        const { type, item, targetCellKey } = dragData;
        const { cellKey, status } = dropData;

        // Handle subject drop to empty cell
        if (type === 'SUBJECT' && status === 'EMPTY') {
            dispatch(setSubjectToCell({ cellKey, subject: item as Subject }));
        }

        // Handle teacher drop to cell awaiting teacher
        if (type === 'TEACHER' && status === 'AWAITING_TEACHER') {
            // Verify the teacher is being dropped on the correct target cell
            if (targetCellKey === cellKey) {
                dispatch(setTeacherToCell({ cellKey, teacher: item as Teacher }));
            }
        }
    }, [dispatch]);

    const handleSaveDraft = () => {
        const payload = {
            class: selectedClass,
            section: selectedSection,
            grid: Object.entries(grid).reduce((acc, [key, value]) => {
                if (value.status !== 'EMPTY') {
                    acc[key] = value;
                }
                return acc;
            }, {} as typeof grid),
        };
        console.log('Save Draft Payload:', payload);
        alert('Draft saved! Check console for payload.');
    };

    const handlePublish = () => {
        const payload = {
            class: selectedClass,
            section: selectedSection,
            grid: Object.entries(grid).reduce((acc, [key, value]) => {
                if (value.status !== 'EMPTY') {
                    acc[key] = value;
                }
                return acc;
            }, {} as typeof grid),
        };
        console.log('Publish Payload:', payload);
        alert('Timetable published! Check console for payload.');
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset the timetable? All changes will be lost.')) {
            dispatch(resetGrid());
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="min-h-screen bg-background">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border"
                >
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate('/timetable')}
                                    className="shrink-0"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                                <div>
                                    <h1 className="text-lg font-semibold text-foreground">
                                        Timetable Editor
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedClass?.name || 'Class'} - {selectedSection?.name || 'Section'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReset}
                                    className="gap-2"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Reset
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSaveDraft}
                                    className="gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Draft
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handlePublish}
                                    className="gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    Publish
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.header>

                {/* Main Content - 3 Column Layout */}
                <div className="container mx-auto px-4 py-6">
                    <div className="grid grid-cols-[260px_1fr_260px] gap-6 min-h-[calc(100vh-120px)]">
                        {/* Left Sidebar - Subjects */}
                        <motion.aside
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <SidebarSubjects />
                        </motion.aside>

                        {/* Center - Timetable Grid */}
                        <motion.main
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-card/30 rounded-xl p-4 border border-border/50"
                        >
                            <TimetableGrid />
                        </motion.main>

                        {/* Right Sidebar - Teachers */}
                        <motion.aside
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <SidebarTeachers />
                        </motion.aside>
                    </div>
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeDragItem && (
                        <div className="p-3 rounded-lg bg-card border border-primary shadow-2xl">
                            <span className="text-sm font-medium">
                                {(activeDragItem.item as Subject).name || (activeDragItem.item as Teacher).name}
                            </span>
                        </div>
                    )}
                </DragOverlay>
            </div>
        </DndContext>
    );
}
