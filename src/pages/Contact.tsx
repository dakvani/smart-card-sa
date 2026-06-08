import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Building2, Users, Package, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";


const inquiryTypes = [
  { value: "bulk_order", label: "Bulk NFC Order", icon: Package },
  { value: "enterprise", label: "Enterprise Link Generation", icon: Building2 },
  { value: "team", label: "Team Link Generation", icon: Users },
  { value: "general", label: "General Inquiry", icon: Mail },
];

export default function Contact() {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", company: "", phone: "",
    inquiry_type: "bulk_order", team_size: "", message: "",
  });

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in name, email and message");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("contact_submissions").insert({
      name: form.name,
      email: form.email,
      company: form.company || null,
      phone: form.phone || null,
      inquiry_type: form.inquiry_type,
      team_size: form.team_size || null,
      message: form.message,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not send your inquiry. Try again.");
      return;
    }
    toast.success("Thanks! Our team will reach out within 1 business day.");
    setForm({ name: "", email: "", company: "", phone: "", inquiry_type: "bulk_order", team_size: "", message: "" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24">
        <section className="py-16">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              Let's <span className="gradient-text">talk business</span>
            </motion.h1>
            <p className="text-lg text-muted-foreground">
              Bulk NFC orders, enterprise rollouts, or team link generation — our team is here to help you scale SmartCard across your organization.
            </p>
          </div>
        </section>

        <section className="pb-24">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
              {/* Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  {inquiryTypes.map((t) => (
                    <div key={t.value} className="p-4 rounded-xl bg-card border border-border">
                      <t.icon className="w-5 h-5 text-primary mb-2" />
                      <p className="text-sm font-medium">{t.label}</p>
                    </div>
                  ))}
                </div>

                <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
                  <h3 className="font-semibold text-lg">Reach us directly</h3>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Sales & Partnerships</p>
                      <a href="mailto:sales@smartcard.app" className="text-sm text-muted-foreground hover:text-primary">sales@smartcard.app</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Support</p>
                      <a href="mailto:support@smartcard.app" className="text-sm text-muted-foreground hover:text-primary">support@smartcard.app</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <a href="tel:+18005551234" className="text-sm text-muted-foreground hover:text-primary">+1 (800) 555-1234</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">SmartCard, Inc.</p>
                      <p className="text-sm text-muted-foreground">548 Market St, Suite 8210<br />San Francisco, CA 94104</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form */}
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-3 p-8 rounded-2xl bg-card border border-border space-y-5"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name *</Label>
                    <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Work email *</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" value={form.company} onChange={(e) => update("company", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inquiry_type">Inquiry type</Label>
                    <Select value={form.inquiry_type} onValueChange={(v) => update("inquiry_type", v)}>
                      <SelectTrigger id="inquiry_type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {inquiryTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team_size">Team / order size</Label>
                    <Select value={form.team_size} onValueChange={(v) => update("team_size", v)}>
                      <SelectTrigger id="team_size"><SelectValue placeholder="Select range" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1 - 10</SelectItem>
                        <SelectItem value="11-50">11 - 50</SelectItem>
                        <SelectItem value="51-200">51 - 200</SelectItem>
                        <SelectItem value="201-1000">201 - 1,000</SelectItem>
                        <SelectItem value="1000+">1,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Tell us about your project *</Label>
                  <Textarea id="message" rows={5} value={form.message} onChange={(e) => update("message", e.target.value)} required />
                </div>
                <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : "Send inquiry"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  We reply within 1 business day. Your details are kept private.
                </p>
              </motion.form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
