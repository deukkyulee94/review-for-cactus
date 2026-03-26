import { notFound } from "next/navigation";
import { EditShowForm } from "@/components/admin/EditShowForm";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ performanceId: string }> };

/** 기존 공연·배우 데이터를 불러와 수정 폼에 넣습니다. */
export default async function AdminEditShowPage({ params }: Props) {
  const { performanceId } = await params;
  const supabase = await createClient();

  const { data: performance, error: pErr } = await supabase
    .from("performances")
    .select("*")
    .eq("id", performanceId)
    .maybeSingle();

  if (pErr || !performance) {
    notFound();
  }

  const { data: actors, error: aErr } = await supabase
    .from("actors")
    .select("id, name, role_name, one_liner, profile_photo_url, sort_order")
    .eq("performance_id", performanceId)
    .order("sort_order", { ascending: true });

  if (aErr) {
    return (
      <p className="text-sm text-red-600">
        배우 정보를 불러오지 못했습니다: {aErr.message}
      </p>
    );
  }

  return (
    <EditShowForm performance={performance} actors={actors ?? []} />
  );
}
