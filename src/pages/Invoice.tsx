import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { format } from "date-fns";
import { formatSAR } from "@/lib/currency";
import { SEO } from "@/components/SEO";

interface CustomizationSide {
  name?: string;
  title?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
}

interface OrderItem {
  product: { id: string; name: string; basePrice: number; category: string };
  quantity: number;
  customization?: {
    front?: CustomizationSide;
    back?: CustomizationSide;
    linkedProfileUsername?: string;
  };
}

interface OrderRow {
  id: string;
  order_number: string;
  invoice_number: string | null;
  status: string;
  payment_method: string | null;
  payment_status: string | null;
  items: OrderItem[];
  shipping_info: {
    name: string;
    email: string;
    address: string;
    city: string;
    postalCode?: string;
    country: string;
  };
  subtotal: number;
  shipping_cost: number;
  total: number;
  created_at: string;
  notes?: string | null;
}

interface Company {
  company_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  country: string;
  vat_number: string;
  cr_number: string;
  email: string;
  phone: string;
  logo_url: string | null;
}

const paymentLabel = (m: string | null | undefined) =>
  m === "bank_transfer" ? "Bank Transfer" : "Cash on Delivery";

export default function Invoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth", { state: { returnTo: `/invoice/${id}` } });
        return;
      }
      const [{ data: orderData, error: orderErr }, { data: companyData }] = await Promise.all([
        supabase.from("nfc_orders").select("*").eq("id", id).maybeSingle(),
        supabase.from("invoice_company_settings").select("*").eq("id", 1).maybeSingle(),
      ]);
      if (orderErr || !orderData) {
        setError("Invoice not found or you don't have access.");
        setLoading(false);
        return;
      }
      const parsed: OrderRow = {
        ...orderData,
        items: (typeof orderData.items === "string" ? JSON.parse(orderData.items) : orderData.items) as OrderItem[],
        shipping_info: (typeof orderData.shipping_info === "string"
          ? JSON.parse(orderData.shipping_info)
          : orderData.shipping_info) as OrderRow["shipping_info"],
      } as OrderRow;
      setOrder(parsed);
      if (companyData) setCompany(companyData as Company);
      setLoading(false);
    };
    load();
  }, [id, navigate]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading invoice...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">{error ?? "Invoice not found."}</p>
        <Link to="/order-history">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to orders</Button>
        </Link>
      </div>
    );
  }

  const invoiceNo = order.invoice_number ?? order.order_number;

  return (
    <div className="min-h-screen bg-muted/30 py-8 print:bg-white print:py-0">
      <SEO title={`Invoice ${invoiceNo}`} description={`Invoice ${invoiceNo}`} path={`/invoice/${order.id}`} />

      {/* Toolbar (hidden on print) */}
      <div className="max-w-4xl mx-auto px-4 mb-6 flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => navigate("/order-history")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to orders
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button variant="gradient" onClick={handlePrint}>
            <Download className="w-4 h-4 mr-2" /> Save as PDF
          </Button>
        </div>
      </div>

      {/* Invoice sheet */}
      <article
        className="max-w-4xl mx-auto bg-white text-slate-900 shadow-xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none"
        style={{ colorScheme: "light" }}
      >
        <header className="flex flex-col sm:flex-row justify-between gap-6 p-8 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {company?.logo_url ? (
                <img src={company.logo_url} alt="Logo" className="h-10 w-auto" />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500" />
              )}
              <span className="text-2xl font-bold">{company?.company_name || "SmartCard"}</span>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed">
              {company?.address_line1 && <div>{company.address_line1}</div>}
              {company?.address_line2 && <div>{company.address_line2}</div>}
              {(company?.city || company?.country) && (
                <div>{[company?.city, company?.country].filter(Boolean).join(", ")}</div>
              )}
              {company?.email && <div>{company.email}</div>}
              {company?.phone && <div>{company.phone}</div>}
              {company?.vat_number && <div>VAT: {company.vat_number}</div>}
              {company?.cr_number && <div>CR: {company.cr_number}</div>}
            </div>
          </div>

          <div className="text-right">
            <h1 className="text-3xl font-extrabold tracking-tight">INVOICE</h1>
            <Badge variant="outline" className="mt-1 text-slate-600 border-slate-300">Draft</Badge>
            <div className="mt-4 text-sm space-y-1">
              <div><span className="text-slate-500">Invoice #</span> <span className="font-semibold">{invoiceNo}</span></div>
              <div><span className="text-slate-500">Order #</span> {order.order_number}</div>
              <div><span className="text-slate-500">Date</span> {format(new Date(order.created_at), "MMM d, yyyy")}</div>
            </div>
          </div>
        </header>

        <section className="grid sm:grid-cols-2 gap-6 p-8 border-b border-slate-200">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Billed To</div>
            <div className="text-sm space-y-0.5">
              <div className="font-semibold text-base">{order.shipping_info.name}</div>
              <div>{order.shipping_info.email}</div>
              <div>{order.shipping_info.address}</div>
              <div>
                {[order.shipping_info.city, order.shipping_info.postalCode].filter(Boolean).join(" ")}
                {order.shipping_info.country ? `, ${order.shipping_info.country}` : ""}
              </div>
            </div>
          </div>
          <div className="sm:text-right">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Payment</div>
            <div className="text-sm space-y-0.5">
              <div>Method: <span className="font-medium">{paymentLabel(order.payment_method)}</span></div>
              <div>
                Status:{" "}
                <span className={order.payment_status === "paid" ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                  {(order.payment_status ?? "unpaid").toUpperCase()}
                </span>
              </div>
              <div>Order status: <span className="font-medium capitalize">{order.status}</span></div>
            </div>
          </div>
        </section>

        <section className="p-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500 uppercase text-xs">
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 font-medium text-center w-20">Qty</th>
                <th className="pb-3 font-medium text-right w-32">Unit Price</th>
                <th className="pb-3 font-medium text-right w-32">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it, i) => {
                const c = it.customization;
                const front = c?.front;
                const hasPreview =
                  !!(front?.name || front?.title || c?.linkedProfileUsername ||
                     front?.backgroundColor || front?.textColor || front?.accentColor);
                return (
                <tr key={i} className="border-b border-slate-100 align-top">
                  <td className="py-4">
                    <div className="font-medium">{it.product.name}</div>
                    {hasPreview && (
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        {(front?.backgroundColor || front?.textColor || front?.accentColor) && (
                          <span className="inline-flex items-center gap-1" aria-label="Card colors">
                            {front?.backgroundColor && (
                              <span
                                className="inline-block w-3 h-3 rounded-full border border-slate-300"
                                style={{ backgroundColor: front.backgroundColor }}
                                title={`Background ${front.backgroundColor}`}
                              />
                            )}
                            {front?.textColor && (
                              <span
                                className="inline-block w-3 h-3 rounded-full border border-slate-300"
                                style={{ backgroundColor: front.textColor }}
                                title={`Text ${front.textColor}`}
                              />
                            )}
                            {front?.accentColor && (
                              <span
                                className="inline-block w-3 h-3 rounded-full border border-slate-300"
                                style={{ backgroundColor: front.accentColor }}
                                title={`Accent ${front.accentColor}`}
                              />
                            )}
                          </span>
                        )}
                        {front?.name && <span>Name: {front.name}</span>}
                        {front?.title && <span>Title: {front.title}</span>}
                        {c?.linkedProfileUsername && <span>Profile: @{c.linkedProfileUsername}</span>}
                      </div>
                    )}
                  </td>
                  <td className="py-4 text-center">{it.quantity}</td>
                  <td className="py-4 text-right">{formatSAR(it.product.basePrice)}</td>
                  <td className="py-4 text-right font-medium">{formatSAR(it.product.basePrice * it.quantity)}</td>
                </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex justify-end mt-6">
            <div className="w-full sm:w-72 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatSAR(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>{Number(order.shipping_cost) === 0 ? "Free" : formatSAR(Number(order.shipping_cost))}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-xs italic">
                <span>VAT (added later)</span>
                <span>—</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-3 border-t border-slate-300">
                <span>Total</span>
                <span>{formatSAR(Number(order.total))}</span>
              </div>
            </div>
          </div>
        </section>

        <footer className="px-8 py-6 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 text-center">
          Thank you for your order. This is a draft invoice — VAT and CR details will be added once available.
        </footer>
      </article>

      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
