import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Save, Eye, X } from "lucide-react";
import { getTemplates, saveTemplates, previewTemplates } from "../services/api";

const VARS = ["{{name}}", "{{email}}", "{{company}}"];

export default function Templates() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);

  const { data } = useQuery({
    queryKey: ["templates"],
    queryFn: getTemplates,
  });

  useEffect(() => {
    if (data) {
      setSubject(data.subject);
      setBody(data.body);
    }
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => saveTemplates({ subject, body }),
    onSuccess: () => toast.success("Templates saved!"),
    onError: (e: any) =>
      toast.error(e?.response?.data?.detail || "Failed to save templates."),
  });

  const previewMut = useMutation({
    mutationFn: async () => {
      // Save first, then preview
      await saveTemplates({ subject, body });
      return previewTemplates();
    },
    onSuccess: (d) => setPreview(d),
    onError: (e: any) =>
      toast.error(e?.response?.data?.detail || "Preview failed."),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Edit your email subject and body. Use variables to personalize.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            id="templates-preview-btn"
            className="btn-secondary"
            onClick={() => previewMut.mutate()}
            disabled={previewMut.isPending}
          >
            <Eye className="w-4 h-4" />
            Preview Email
          </button>
          <button
            id="templates-save-btn"
            className="btn-primary"
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
          >
            <Save className="w-4 h-4" />
            {saveMut.isPending ? "Saving..." : "Save Template"}
          </button>
        </div>
      </div>

      {/* Variables hint */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-gray-500">Available variables:</span>
        {VARS.map((v) => (
          <span
            key={v}
            className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-mono rounded border border-purple-100"
          >
            {v}
          </span>
        ))}
      </div>

      {/* Subject */}
      <div className="card space-y-2">
        <label
          htmlFor="templates-subject"
          className="block text-sm font-semibold text-gray-700"
        >
          Email Subject
        </label>
        <input
          id="templates-subject"
          type="text"
          className="input font-medium"
          placeholder='e.g. AI Receptionist for {{company}}'
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      {/* Body */}
      <div className="card space-y-2">
        <label
          htmlFor="templates-body"
          className="block text-sm font-semibold text-gray-700"
        >
          Email Body
        </label>
        <textarea
          id="templates-body"
          className="input resize-none font-mono text-sm leading-relaxed"
          rows={14}
          placeholder={"Hi {{name}},\n\nYour message here...\n\nRegards,\nYour Name"}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Email Preview</h2>
              <button
                id="templates-close-preview"
                onClick={() => setPreview(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Subject
                </p>
                <p className="text-gray-900 font-medium bg-gray-50 px-3 py-2 rounded-lg">
                  {preview.subject}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Body
                </p>
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans bg-gray-50 px-3 py-3 rounded-lg leading-relaxed">
                  {preview.body}
                </pre>
              </div>
              <p className="text-xs text-gray-400 italic">
                Preview uses sample data: John · john@example.com · ABC Ltd
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
