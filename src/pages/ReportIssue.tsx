import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Upload,
  X,
  CheckCircle,
  Info,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";

const issueCategories = [
  "Login / Authentication Issue",
  "Account Access or Permissions",
  "Registration Error",
  "Scoring or Leaderboard Discrepancy",
  "Performance Issue (Slow Loading / Timeout)",
  "Data Display Error",
  "Mobile Compatibility Issue",
  "Other Technical Issue",
];

const severityLevels = [
  {
    value: "critical",
    label: "Critical",
    description: "Unable to access platform or participate",
    color: "text-red-500",
  },
  {
    value: "major",
    label: "Major",
    description: "Core feature not functioning",
    color: "text-orange-500",
  },
  {
    value: "minor",
    label: "Minor",
    description: "Feature works with errors or inconsistencies",
    color: "text-yellow-500",
  },
  {
    value: "cosmetic",
    label: "Cosmetic",
    description: "Formatting or visual display issue only",
    color: "text-blue-400",
  },
];

const deviceTypes = ["Desktop", "Mobile", "Tablet"];

const ReportIssue = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const [form, setForm] = useState({
    fullName: "",
    unit: "",
    email: "",
    deviceType: "",
    browser: "",
    dateTime: "",
    category: "",
    severity: "",
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "DEFIT – Report an Issue",
      description:
        "Report technical issues, system errors, or platform malfunctions within the DEFIT platform.",
      mainEntity: {
        "@type": "ContactPage",
        name: "DEFIT Technical Issue Report",
      },
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const newFiles = Array.from(selected).filter(
      (f) => f.size <= 10 * 1024 * 1024
    );
    if (newFiles.length < (selected?.length || 0)) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10 MB.",
        variant: "destructive",
      });
    }
    setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    if (!form.unit.trim()) e.unit = "Organization / Unit is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = "Enter a valid email address.";
    if (!form.deviceType) e.deviceType = "Select a device type.";
    if (!form.browser.trim()) e.browser = "Browser and version is required.";
    if (!form.dateTime.trim()) e.dateTime = "Date and time is required.";
    if (!form.category) e.category = "Select an issue category.";
    if (!form.severity) e.severity = "Select a severity level.";
    if (!form.description.trim()) e.description = "Description is required.";
    else if (form.description.trim().length < 20)
      e.description = "Please provide at least 20 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast({
        title: "Missing information",
        description: "Please complete all required fields before submitting.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    // Simulate submission — replace with actual endpoint later
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast({
        title: "Issue submitted",
        description:
          "Your report has been received. Critical issues are prioritized.",
      });
    }, 1500);
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-background texture-canvas">
        <Navbar />
        <section className="pt-32 pb-16">
          <div className="container px-4">
            <div className="max-w-2xl mx-auto text-center glass rounded-2xl p-12">
              <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Report <span className="text-gradient">Received</span>
              </h1>
              <p className="text-muted-foreground mb-2">
                Your issue has been logged and will be reviewed within{" "}
                <strong className="text-foreground">one business day</strong>.
              </p>
              <p className="text-muted-foreground mb-8">
                Critical access issues are prioritized for immediate review.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="default"
                  onClick={() => {
                    setSubmitted(false);
                    setForm({
                      fullName: "",
                      unit: "",
                      email: "",
                      deviceType: "",
                      browser: "",
                      dateTime: "",
                      category: "",
                      severity: "",
                      description: "",
                    });
                    setFiles([]);
                  }}
                >
                  Submit Another Issue
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/dashboard">Return to Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background texture-canvas">
      <Navbar />

      {/* Header */}
      <section className="pt-32 pb-8">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Report an <span className="text-gradient">Issue</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              This page is used to report technical issues, system errors, or
              platform malfunctions within the DEFIT website or application.
            </p>
          </div>
        </div>
      </section>

      {/* Guidance Banner */}
      <section className="pb-8">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <div className="glass rounded-xl p-5 flex items-start gap-4 border-primary/20">
              <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  For registration questions, rule clarifications, or general
                  inquiries, please refer to the{" "}
                  <Link
                    to="/faq"
                    className="text-primary hover:underline font-medium"
                  >
                    FAQ
                  </Link>{" "}
                  or Contact POC page.
                </p>
                <p>
                  Incomplete submissions may delay troubleshooting. Please
                  gather your device info, browser version, and a screenshot
                  before submitting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="pb-16">
        <div className="container px-4">
          <form
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto space-y-10"
          >
            {/* Contact Information */}
            <div className="glass rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Contact Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="fullName">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Last, First MI"
                    value={form.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    maxLength={100}
                    className={errors.fullName ? "border-destructive" : ""}
                  />
                  {errors.fullName && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.fullName}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="unit">
                    Organization / Unit{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="unit"
                    placeholder="e.g. 377th TSC"
                    value={form.unit}
                    onChange={(e) => updateField("unit", e.target.value)}
                    maxLength={100}
                    className={errors.unit ? "border-destructive" : ""}
                  />
                  {errors.unit && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.unit}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="email">
                    Official Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@mail.mil"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    maxLength={255}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Environment Details */}
            <div className="glass rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Environment Details
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="deviceType">
                    Device Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.deviceType}
                    onValueChange={(v) => updateField("deviceType", v)}
                  >
                    <SelectTrigger
                      className={errors.deviceType ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Select device" />
                    </SelectTrigger>
                    <SelectContent>
                      {deviceTypes.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.deviceType && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.deviceType}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="browser">
                    Browser & Version{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="browser"
                    placeholder="e.g. Chrome 121, Safari 17"
                    value={form.browser}
                    onChange={(e) => updateField("browser", e.target.value)}
                    maxLength={100}
                    className={errors.browser ? "border-destructive" : ""}
                  />
                  {errors.browser && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.browser}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="dateTime">
                    Date & Time of Issue{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dateTime"
                    type="datetime-local"
                    value={form.dateTime}
                    onChange={(e) => updateField("dateTime", e.target.value)}
                    className={errors.dateTime ? "border-destructive" : ""}
                  />
                  {errors.dateTime && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.dateTime}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Issue Classification */}
            <div className="glass rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6">Issue Classification</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => updateField("category", v)}
                  >
                    <SelectTrigger
                      className={errors.category ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {issueCategories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.category}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="severity">
                    Severity Level <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.severity}
                    onValueChange={(v) => updateField("severity", v)}
                  >
                    <SelectTrigger
                      className={errors.severity ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      {severityLevels.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <span className="flex items-center gap-2">
                            <span className={`font-semibold ${s.color}`}>
                              {s.label}
                            </span>
                            <span className="text-muted-foreground text-xs hidden sm:inline">
                              — {s.description}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.severity && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.severity}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Description & Attachments */}
            <div className="glass rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6">
                Description & Attachments
              </h2>

              <div className="mb-6">
                <Label htmlFor="description">
                  Detailed Description{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Include the steps taken immediately before the issue occurred,
                  what you expected to happen, and what actually happened.
                </p>
                <Textarea
                  id="description"
                  rows={6}
                  placeholder="1. Navigated to the leaderboard page&#10;2. Clicked on 'Unit Rankings'&#10;3. Page showed a blank white screen instead of data..."
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  maxLength={2000}
                  className={errors.description ? "border-destructive" : ""}
                />
                <div className="flex justify-between mt-1">
                  {errors.description ? (
                    <p className="text-destructive text-xs">
                      {errors.description}
                    </p>
                  ) : (
                    <span />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {form.description.length}/2000
                  </p>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <Label>Screenshots / Supporting Documentation</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Up to 5 files, 10 MB each. PNG, JPG, PDF accepted.
                </p>
                <div
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag files here
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                {files.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {files.map((file, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between glass rounded-lg px-4 py-2 text-sm"
                      >
                        <span className="truncate text-foreground">
                          {file.name}{" "}
                          <span className="text-muted-foreground">
                            ({(file.size / 1024).toFixed(0)} KB)
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="text-muted-foreground hover:text-destructive ml-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Response Timeline */}
            <div className="glass rounded-xl p-5 flex items-start gap-4 border-primary/20">
              <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                All submissions are reviewed within{" "}
                <strong className="text-foreground">one business day</strong>.
                Critical access issues are prioritized for immediate review.
              </p>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="min-w-[200px]"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </form>
        </div>
      </section>

      <BackToTop />
      <Footer />
    </main>
  );
};

export default ReportIssue;
