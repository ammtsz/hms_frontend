import React, { useEffect, useState } from "react";
import { StickyNote } from "lucide-react";
import type { PatientPageSectionId } from "@/features/patients/detail/PatientPageSectionNav";
import { usePatientPageScrollTarget } from "@/features/patients/detail/PatientPageSectionNav";
import {
  usePatientNotes,
  useCreatePatientNote,
  useUpdatePatientNote,
  useDeletePatientNote,
} from "@/api/query/hooks/usePatientNotesQueries";
import type {
  PatientNoteResponseDto,
  CreatePatientNoteRequest,
  NoteCategory,
} from "@/api/types";
import { useNoteCategories } from "@/api/query/hooks/useNoteCategoriesQueries";
import { formatDateBR } from "@/utils/dateUtils";
import { DetailCardCollapsibleHeader } from "@/features/patients/detail/shared/DetailCardCollapsibleHeader";
import {
  Button,
  Card,
  CardBody,
  Field,
  Select,
  Textarea,
} from "@/components/ui";

interface PatientNotesCardProps {
  patientId: string;
  sectionId?: PatientPageSectionId;
}

export const PatientNotesCard: React.FC<PatientNotesCardProps> = ({
  patientId,
  sectionId,
}) => {
  // UI state
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { scrollTargetSectionId, setScrollTargetSectionId } =
    usePatientPageScrollTarget();

  useEffect(() => {
    if (sectionId && scrollTargetSectionId === sectionId) {
      setIsCollapsed(false);
      setScrollTargetSectionId(null);
    }
  }, [sectionId, scrollTargetSectionId, setScrollTargetSectionId]);

  // React Query hooks for data fetching and mutations
  const {
    data: notes = [],
    isLoading: loading,
    error: fetchError,
  } = usePatientNotes(patientId);

  const { data: noteCategories = [] } = useNoteCategories(true);
  const createNoteMutation = useCreatePatientNote();
  const updateNoteMutation = useUpdatePatientNote();
  const deleteNoteMutation = useDeletePatientNote();

  // Local UI state
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState<NoteCategory>("geral");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const categoriesByValue = React.useMemo(() => {
    return new Map(noteCategories.map((c) => [c.value, c]));
  }, [noteCategories]);

  const activeNoteCategories = React.useMemo(() => {
    return [...noteCategories]
      .filter((c) => c.isActive)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [noteCategories]);

  // Compute error state from fetch error or mutation errors
  const error =
    fetchError?.message ||
    createNoteMutation.error?.message ||
    updateNoteMutation.error?.message ||
    deleteNoteMutation.error?.message ||
    null;

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    const noteData: CreatePatientNoteRequest = {
      noteContent: newNoteContent.trim(),
      category: newNoteCategory,
    };

    try {
      await createNoteMutation.mutateAsync({
        patientId,
        noteData,
      });

      // Reset form on success
      setNewNoteContent("");
      setNewNoteCategory("geral");
      setIsAddingNote(false);
    } catch (error) {
      // Error is handled by the mutation and displayed via error state
      console.error("Failed to create note:", error);
    }
  };

  const handleEditNote = async (noteId: number, content: string) => {
    try {
      await updateNoteMutation.mutateAsync({
        patientId,
        noteId: noteId.toString(),
        noteData: {
          noteContent: content.trim(),
        },
      });

      setEditingNoteId(null);
    } catch (error) {
      // Error is handled by the mutation and displayed via error state
      console.error("Failed to update note:", error);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await deleteNoteMutation.mutateAsync({
        patientId,
        noteId: noteId.toString(),
      });

      setDeleteConfirmId(null);
    } catch (error) {
      // Error is handled by the mutation and displayed via error state
      console.error("Failed to delete note:", error);
    }
  };

  const handleCancelAdd = () => {
    setIsAddingNote(false);
    setNewNoteContent("");
    setNewNoteCategory("geral");
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardBody>
          <div
            className="animate-pulse space-y-4"
            data-testid="loading-skeleton"
          >
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardBody>
        <DetailCardCollapsibleHeader
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
          title={
            <>
              <StickyNote
                className="h-5 w-5 shrink-0 text-gray-600"
                aria-hidden
              />
              Anotações
              {notes.length > 0 ? (
                <span className="text-sm font-normal text-gray-500">
                  ({notes.length})
                </span>
              ) : null}
            </>
          }
          actions={
            !isCollapsed ? (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setIsAddingNote(true)}
                className="shrink-0 text-gray-600"
              >
                + Adicionar
              </Button>
            ) : null
          }
        />

        {!isCollapsed && (
          <>
            {error && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                <div className="flex items-center">
                  <div className="text-orange-500 mr-3">⚠️</div>
                  <p className="text-orange-800 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Add new note form */}
            {isAddingNote && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 gap-4 flex flex-col">
                <Field label="Categoria">
                  <Select
                    value={newNoteCategory}
                    onChange={(e) =>
                      setNewNoteCategory(e.target.value as NoteCategory)
                    }
                  >
                    {activeNoteCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label || category.value}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="flex flex-col gap-1">
                  <Textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="mb-1 min-h-[100px] resize-y"
                    placeholder="Digite a nota..."
                    maxLength={2000}
                  />
                  <span className="ml-auto text-xs text-gray-500">
                    {newNoteContent.length}/2000 caracteres
                  </span>
                </div>
                <div className="mt-4 flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelAdd}
                    className="min-h-[44px] w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddNote}
                    disabled={!newNoteContent.trim()}
                    className="min-h-[44px] w-full sm:w-auto"
                  >
                    Salvar Nota
                  </Button>
                </div>
              </div>
            )}

            {/* Notes list */}
            {notes.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg mb-2">📝</div>
                <p className="text-sm text-gray-600">
                  Nenhuma nota adicionada ainda.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Clique em &quot;+ Adicionar&quot; para adicionar observações
                  importantes.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notes.map((note: PatientNoteResponseDto) => (
                  <div
                    key={note.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <span className="text-md font-semibold text-gray-700">
                          {(
                            categoriesByValue.get(note.category)?.label ??
                            note.category
                          ).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingNoteId(note.id)}
                          className="min-h-[44px] px-2 py-1 text-xs text-blue-600 hover:text-blue-800 sm:min-h-0"
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(note.id)}
                          className="min-h-[44px] px-2 py-1 text-xs text-red-600 hover:text-red-800 sm:min-h-0"
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>

                    {editingNoteId === note.id ? (
                      <EditNoteForm
                        note={note}
                        onSave={(content) => handleEditNote(note.id, content)}
                        onCancel={handleCancelEdit}
                      />
                    ) : (
                      <>
                        <div className="text-gray-900 mb-2 whitespace-pre-wrap">
                          {note.noteContent}
                        </div>
                        <div className="text-xs text-gray-500">
                          Criado em {formatDateBR(note.createdDate)} às{" "}
                          {note.createdTime.slice(0, 5)}
                          {note.updatedDate !== note.createdDate && (
                            <span>
                              {" • "}Editado em {formatDateBR(note.updatedDate)}{" "}
                              às {note.updatedTime}
                            </span>
                          )}
                        </div>
                      </>
                    )}

                    {/* Delete confirmation */}
                    {deleteConfirmId === note.id && (
                      <div className="mt-3 p-3 bg-gray-100 border border-gray-300 rounded">
                        <p className="text-gray-700 text-sm mb-2">
                          Tem certeza que deseja excluir esta nota?
                        </p>
                        <div className="flex gap-2 justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <div className="text-xs text-gray-500">
                💡 Utilize as notas para registrar observações importantes sobre
                o comportamento, evolução do quadro, ou informações relevantes
                para futuros atendimentos.
              </div>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
};

// Edit Note Form Component
interface EditNoteFormProps {
  note: PatientNoteResponseDto;
  onSave: (content: string) => void;
  onCancel: () => void;
}

const EditNoteForm: React.FC<EditNoteFormProps> = ({
  note,
  onSave,
  onCancel,
}) => {
  const [content, setContent] = useState(note.noteContent);

  const handleSave = () => {
    if (content.trim()) {
      onSave(content);
    }
  };

  return (
    <div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="mb-3 min-h-[100px] resize-y"
        maxLength={2000}
      />
      <div className="flex flex-col justify-between items-center">
        <span className="ml-auto text-xs text-gray-500">
          {content.length}/2000 caracteres
        </span>
        <div className="mt-4 flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="min-h-[44px] w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!content.trim()}
            className="min-h-[44px] w-full sm:w-auto"
          >
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
};
