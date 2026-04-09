import { HeartPulse, Activity, FileText, AlertTriangle, Syringe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HealthPage() {
  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HeartPulse className="h-8 w-8 text-rose-500" />
            Health & Well-being
          </h1>
          <p className="text-muted-foreground mt-1">Medical records, BMI, and emergency contact details.</p>
        </div>
        <Button variant="outline"><FileText className="w-4 h-4 mr-2" /> Download Medical Record</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 col-span-1 border-t-4 border-t-rose-500 flex flex-col justify-center items-center text-center">
          <div className="p-4 bg-rose-500/10 rounded-full mb-4">
            <Activity className="w-8 h-8 text-rose-500" />
          </div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Blood Group</h3>
          <p className="text-4xl font-black text-foreground">O+</p>
        </Card>
        
        <Card className="p-6 col-span-1 border-t-4 border-t-blue-500 flex flex-col justify-center items-center text-center">
          <div className="p-4 bg-blue-500/10 rounded-full mb-4">
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Latest BMI</h3>
          <p className="text-4xl font-black text-foreground">18.5</p>
          <Badge variant="secondary" className="mt-2 bg-emerald-500/10 text-emerald-600">Healthy Range</Badge>
        </Card>

        <Card className="p-6 col-span-1 border-t-4 border-t-amber-500 flex flex-col justify-center items-center text-center">
          <div className="p-4 bg-amber-500/10 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Allergies</h3>
          <p className="text-lg font-bold text-foreground">Peanuts, Dust Mites</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold flex items-center gap-2 mb-6">
            <Syringe className="w-5 h-5 text-primary" /> Vaccination Records
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-semibold">COVID-19 (Booster)</p>
                <p className="text-sm text-muted-foreground">Administered on: 12 Jan 2024</p>
              </div>
              <Badge className="bg-emerald-500 hover:bg-emerald-600">Completed</Badge>
            </div>
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-semibold">Hepatitis B (Dose 3)</p>
                <p className="text-sm text-muted-foreground">Due By: 01 Aug 2026</p>
              </div>
              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Upcoming</Badge>
            </div>
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-semibold">Typhoid</p>
                <p className="text-sm text-muted-foreground">Administered on: 05 Mar 2021</p>
              </div>
              <Badge className="bg-emerald-500 hover:bg-emerald-600">Completed</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-rose-500/5 to-rose-500/10 border-rose-500/20">
          <h3 className="font-bold flex items-center gap-2 mb-6 text-rose-600">
            <AlertTriangle className="w-5 h-5" /> Emergency Contacts
          </h3>
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-1">Primary Contact (Father)</p>
              <p className="text-lg font-bold">Mr. Rahul Sharma</p>
              <p className="text-muted-foreground">+91 98765 43210</p>
            </div>
            <div className="pt-4 border-t border-rose-500/20">
              <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-1">Secondary Contact (Mother)</p>
              <p className="text-lg font-bold">Mrs. Sneha Sharma</p>
              <p className="text-muted-foreground">+91 98765 43211</p>
            </div>
            <div className="pt-4 border-t border-rose-500/20">
              <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-1">Family Doctor</p>
              <p className="text-lg font-bold">Dr. Anil Deshmukh</p>
              <p className="text-muted-foreground">+91 98765 00000</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
