"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateSchoolProfile } from "@/app/(dashboard)/dashboard/settings/school/actions";
import { Loader2 } from "lucide-react";

export function SchoolProfileForm({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || "");

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("logoUrl", logoUrl); // Add the base64 logo
      
      const res = await updateSchoolProfile(formData);
      if (res.success) {
        toast.success("School profile updated successfully");
      } else {
        toast.error(res.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="logo">School Logo</Label>
        <div className="flex items-center gap-4">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain border rounded" />
          )}
          <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="name">School Name</Label>
        <Input id="name" name="name" defaultValue={initialData?.name} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="gstin">GSTIN</Label>
        <Input id="gstin" name="gstin" defaultValue={initialData?.gstin} placeholder="Applied For" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={initialData?.email} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" name="phone" defaultValue={initialData?.phone} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" defaultValue={initialData?.address} />
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </form>
  );
}
