import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { parts, artifactTypes, partNames, type Artifact, type Part, type ArtifactType } from "@shared/schema";

const artifactFormSchema = z.object({
  patternId: z.string().min(1, "Pattern ID is required").regex(/^[A-G]\.\d+(\.\d+)*$/, "Invalid pattern ID format (e.g., A.1, B.2.3)"),
  title: z.string().min(1, "Title is required"),
  part: z.enum(parts),
  type: z.enum(artifactTypes),
  status: z.string().optional(),
  techLabel: z.string().optional(),
  plainLabel: z.string().optional(),
  tags: z.string().optional(),
  problemFrame: z.string().optional(),
  problem: z.string().optional(),
  forces: z.string().optional(),
  solution: z.string().optional(),
  conformanceChecklist: z.string().optional(),
  antiPatterns: z.string().optional(),
  relations: z.string().optional(),
  rationale: z.string().optional(),
  body: z.string().optional(),
});

type ArtifactFormValues = z.infer<typeof artifactFormSchema>;

const templateSections = `## Problem Frame
[Describe the context and circumstances where this pattern applies]

## Problem
[State the core problem this pattern addresses]

## Forces
[List the competing concerns and constraints]

## Solution
[Describe the recommended approach]

## Conformance Checklist
- [ ] Criterion 1
- [ ] Criterion 2

## Common Anti-patterns
[Describe what NOT to do]

## Relations
[List related patterns: Builds on A.1, Informs B.2, etc.]

## Rationale
[Optional: Explain why this solution works]`;

function ArtifactForm({
  artifact,
  onSuccess,
  onCancel,
}: {
  artifact?: Artifact;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const isEditing = !!artifact;

  const form = useForm<ArtifactFormValues>({
    resolver: zodResolver(artifactFormSchema),
    defaultValues: {
      patternId: artifact?.patternId || "",
      title: artifact?.title || "",
      part: (artifact?.part as Part) || "A",
      type: (artifact?.type as ArtifactType) || "Card",
      status: artifact?.status || "Draft",
      techLabel: artifact?.techLabel || "",
      plainLabel: artifact?.plainLabel || "",
      tags: artifact?.tags?.join(", ") || "",
      problemFrame: artifact?.problemFrame || "",
      problem: artifact?.problem || "",
      forces: artifact?.forces || "",
      solution: artifact?.solution || "",
      conformanceChecklist: artifact?.conformanceChecklist || "",
      antiPatterns: artifact?.antiPatterns || "",
      relations: artifact?.relations || "",
      rationale: artifact?.rationale || "",
      body: artifact?.body || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ArtifactFormValues) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };
      return apiRequest("POST", "/api/artifacts", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artifacts"] });
      toast({ title: "Pattern created successfully" });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create pattern", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ArtifactFormValues) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };
      return apiRequest("PATCH", `/api/artifacts/${artifact?.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artifacts"] });
      toast({ title: "Pattern updated successfully" });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update pattern", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: ArtifactFormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="patternId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pattern ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="A.1.2"
                        {...field}
                        disabled={isEditing}
                        data-testid="input-pattern-id"
                      />
                    </FormControl>
                    <FormDescription>Format: A.1, B.2.3, etc.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Stable">Stable</SelectItem>
                        <SelectItem value="Deprecated">Deprecated</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Pattern title" {...field} data-testid="input-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="part"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-part">
                          <SelectValue placeholder="Select part" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {parts.map((part) => (
                          <SelectItem key={part} value={part}>
                            Part {part}: {partNames[part]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {artifactTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="techLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technical Label</FormLabel>
                    <FormControl>
                      <Input placeholder="Technical term" {...field} data-testid="input-tech-label" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plainLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plain Label</FormLabel>
                    <FormControl>
                      <Input placeholder="Plain language term" {...field} data-testid="input-plain-label" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="problemFrame"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problem Frame</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the context..."
                      className="min-h-20"
                      {...field}
                      data-testid="textarea-problem-frame"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="problem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problem</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="State the core problem..."
                      className="min-h-20"
                      {...field}
                      data-testid="textarea-problem"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="forces"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forces</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List competing concerns..."
                      className="min-h-20"
                      {...field}
                      data-testid="textarea-forces"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="solution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Solution</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the recommended approach..."
                      className="min-h-24"
                      {...field}
                      data-testid="textarea-solution"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="conformanceChecklist"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conformance Checklist</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="- [ ] Criterion 1&#10;- [ ] Criterion 2"
                      className="min-h-20"
                      {...field}
                      data-testid="textarea-conformance"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="antiPatterns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Common Anti-patterns</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what NOT to do..."
                      className="min-h-20"
                      {...field}
                      data-testid="textarea-anti-patterns"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="relations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relations</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Builds on A.1, Informs B.2..."
                      className="min-h-16"
                      {...field}
                      data-testid="textarea-relations"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rationale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rationale (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why this solution works..."
                      className="min-h-16"
                      {...field}
                      data-testid="textarea-rationale"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="tag1, tag2, tag3"
                      {...field}
                      data-testid="input-tags"
                    />
                  </FormControl>
                  <FormDescription>Comma-separated list of tags</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional content in markdown format..."
                      className="min-h-32 font-mono text-sm"
                      {...field}
                      data-testid="textarea-body"
                    />
                  </FormControl>
                  <FormDescription>Markdown formatting supported</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-save-artifact">
            {isPending && <i className="ti ti-loader-2 animate-spin mr-2" />}
            {isEditing ? "Update Pattern" : "Create Pattern"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingArtifact, setEditingArtifact] = useState<Artifact | null>(null);

  const { data: artifacts = [], isLoading } = useQuery<Artifact[]>({
    queryKey: ["/api/artifacts"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/artifacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artifacts"] });
      toast({ title: "Pattern deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete pattern", description: error.message, variant: "destructive" });
    },
  });

  const sortedArtifacts = [...artifacts].sort((a, b) =>
    a.patternId.localeCompare(b.patternId, undefined, { numeric: true })
  );

  return (
    <div className="min-h-full p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <i className="ti ti-settings text-primary" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage FPF patterns and artifacts
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-pattern">
                <i className="ti ti-plus mr-2" />
                New Pattern
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Pattern</DialogTitle>
                <DialogDescription>
                  Add a new FPF pattern to the knowledge base
                </DialogDescription>
              </DialogHeader>
              <ArtifactForm
                onSuccess={() => setIsCreateOpen(false)}
                onCancel={() => setIsCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Patterns</CardDescription>
              <CardTitle className="text-3xl">{artifacts.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Stable</CardDescription>
              <CardTitle className="text-3xl text-primary">
                {artifacts.filter((a) => a.status === "Stable").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Draft</CardDescription>
              <CardTitle className="text-3xl">
                {artifacts.filter((a) => a.status === "Draft").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>New</CardDescription>
              <CardTitle className="text-3xl">
                {artifacts.filter((a) => a.status === "New").length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Artifacts List */}
        <Card>
          <CardHeader>
            <CardTitle>All Patterns</CardTitle>
            <CardDescription>
              {artifacts.length} pattern{artifacts.length !== 1 ? "s" : ""} in the knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : artifacts.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <i className="ti ti-files-off text-4xl text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No patterns yet</p>
                <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  <i className="ti ti-plus mr-2" />
                  Create your first pattern
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sortedArtifacts.map((artifact) => (
                  <div
                    key={artifact.id}
                    className="flex items-center justify-between gap-4 py-4 flex-wrap"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Badge variant="outline" className="font-mono shrink-0">
                        {artifact.patternId}
                      </Badge>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{artifact.title}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            Part {artifact.part}
                          </Badge>
                          {artifact.type && (
                            <Badge variant="secondary" className="text-xs">
                              {artifact.type}
                            </Badge>
                          )}
                          {artifact.status && (
                            <Badge
                              variant={artifact.status === "Stable" ? "default" : "secondary"}
                              className={`text-xs ${artifact.status === "Stable" ? "bg-primary" : ""}`}
                            >
                              {artifact.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Dialog
                        open={editingArtifact?.id === artifact.id}
                        onOpenChange={(open) => !open && setEditingArtifact(null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingArtifact(artifact)}
                            data-testid={`button-edit-${artifact.patternId}`}
                          >
                            <i className="ti ti-edit" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Pattern: {artifact.patternId}</DialogTitle>
                            <DialogDescription>
                              Update the pattern details
                            </DialogDescription>
                          </DialogHeader>
                          {editingArtifact && (
                            <ArtifactForm
                              artifact={editingArtifact}
                              onSuccess={() => setEditingArtifact(null)}
                              onCancel={() => setEditingArtifact(null)}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-delete-${artifact.patternId}`}
                          >
                            <i className="ti ti-trash text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Pattern?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{artifact.patternId} - {artifact.title}".
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(artifact.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
