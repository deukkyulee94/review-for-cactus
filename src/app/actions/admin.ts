"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminAuthenticated } from "@/lib/admin-session";

/** FormData에서 actor_name_{n}, actor_oneliner_{n} 패턴으로 배우 목록을 수집합니다. */
function collectActorsFromFormData(formData: FormData) {
  const indices = new Set<number>();
  for (const key of formData.keys()) {
    const m = /^actor_name_(\d+)$/.exec(key);
    if (m) indices.add(Number(m[1]));
  }
  return [...indices]
    .sort((a, b) => a - b)
    .map((index) => ({
      index,
      name: String(formData.get(`actor_name_${index}`) ?? "").trim(),
      role_name: String(formData.get(`actor_role_${index}`) ?? "").trim(),
      one_liner: String(formData.get(`actor_oneliner_${index}`) ?? "").trim(),
    }));
}

/** 업로드 파일 확장자 추출(스토리지 경로용). */
function extFromFile(file: File): string {
  const n = file.name;
  const i = n.lastIndexOf(".");
  if (i === -1) return "jpg";
  const ext = n
    .slice(i + 1)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return ext || "jpg";
}

/**
 * upsert 로 같은 스토리지 경로를 쓰면 공개 URL 문자열이 동일해져 브라우저·next/image 가 옛 이미지를 보여줄 수 있습니다.
 * DB에 넣을 때마다 버전 쿼리를 붙여 캐시를 끊습니다.
 */
function cacheBustedStorageUrl(publicUrl: string): string {
  const u = new URL(publicUrl);
  u.searchParams.set("v", String(Date.now()));
  return u.toString();
}

/**
 * 공연 + 배우 N명 + 포스터/프로필 이미지를 한 번에 등록합니다.
 * Service Role 클라이언트로 DB·Storage에 쓰기합니다.
 */
export async function createPerformanceWithActors(formData: FormData) {
  if (!(await isAdminAuthenticated())) {
    return { ok: false as const, message: "로그인이 필요합니다." };
  }

  try {
    return await runCreatePerformanceWithActors(formData);
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    console.error("[createPerformanceWithActors]", e);
    return { ok: false as const, message: msg };
  }
}

async function runCreatePerformanceWithActors(formData: FormData) {
  const admin = createAdminClient();
  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description =
    String(formData.get("description") ?? "").trim() || null;
  const period_start = String(formData.get("period_start") ?? "");
  const period_end = String(formData.get("period_end") ?? "");
  const poster = formData.get("poster");
  const actors = collectActorsFromFormData(formData);

  if (!slug || !title || !period_start || !period_end) {
    return { ok: false as const, message: "슬러그·제목·공연 기간은 필수입니다." };
  }
  if (!(poster instanceof File) || poster.size === 0) {
    return { ok: false as const, message: "포스터 이미지를 선택하세요." };
  }
  if (actors.length === 0) {
    return { ok: false as const, message: "배우를 한 명 이상 등록하세요." };
  }

  for (const a of actors) {
    if (!a.name) {
      return {
        ok: false as const,
        message: `배우 ${a.index + 1}번 이름을 입력하세요.`,
      };
    }
    const photo = formData.get(`actor_photo_${a.index}`);
    if (!(photo instanceof File) || photo.size === 0) {
      return {
        ok: false as const,
        message: `배우 ${a.index + 1}번 프로필 사진을 선택하세요.`,
      };
    }
  }

  const { data: perf, error: perfErr } = await admin
    .from("performances")
    .insert({
      slug,
      title,
      description,
      period_start,
      period_end,
      poster_url: null,
    })
    .select()
    .single();

  if (perfErr || !perf) {
    return {
      ok: false as const,
      message: perfErr?.message ?? "공연 저장에 실패했습니다. 슬러그가 중복일 수 있습니다.",
    };
  }

  const perfId = perf.id as string;
  const posterPath = `${perfId}/poster.${extFromFile(poster)}`;
  const { error: upPoster } = await admin.storage
    .from("posters")
    .upload(posterPath, poster, {
      upsert: true,
      contentType: poster.type || "image/jpeg",
    });

  if (upPoster) {
    await admin.from("performances").delete().eq("id", perfId);
    return {
      ok: false as const,
      message: `포스터 업로드 실패: ${upPoster.message}`,
    };
  }

  const { data: pubPoster } = admin.storage.from("posters").getPublicUrl(posterPath);
  await admin
    .from("performances")
    .update({ poster_url: pubPoster.publicUrl })
    .eq("id", perfId);

  for (let ord = 0; ord < actors.length; ord++) {
    const a = actors[ord];
    const photo = formData.get(`actor_photo_${a.index}`) as File;

    const { data: actorRow, error: actorErr } = await admin
      .from("actors")
      .insert({
        performance_id: perfId,
        name: a.name,
        role_name: a.role_name || null,
        one_liner: a.one_liner || null,
        profile_photo_url: null,
        sort_order: ord,
      })
      .select()
      .single();

    if (actorErr || !actorRow) {
      return {
        ok: false as const,
        message: actorErr?.message ?? "배우 저장에 실패했습니다.",
      };
    }

    const actorId = actorRow.id as string;
    const apath = `${perfId}/${actorId}.${extFromFile(photo)}`;
    const { error: upA } = await admin.storage
      .from("actor-photos")
      .upload(apath, photo, {
        upsert: true,
        contentType: photo.type || "image/jpeg",
      });

    if (upA) {
      return {
        ok: false as const,
        message: `배우 사진 업로드 실패: ${upA.message}`,
      };
    }

    const { data: pubA } = admin.storage.from("actor-photos").getPublicUrl(apath);
    await admin
      .from("actors")
      .update({ profile_photo_url: cacheBustedStorageUrl(pubA.publicUrl) })
      .eq("id", actorId);
  }

  revalidatePath("/");
  revalidatePath("/admin/shows");
  revalidatePath(`/show/${slug}`);
  return { ok: true as const, slug };
}

type ActorUpdateEntry = {
  index: number;
  dbId: string | null;
  name: string;
  role_name: string;
  one_liner: string;
  photo: FormDataEntryValue | null;
};

function collectActorUpdateEntries(formData: FormData): ActorUpdateEntry[] {
  const indices = new Set<number>();
  for (const key of formData.keys()) {
    const m = /^actor_name_(\d+)$/.exec(key);
    if (m) indices.add(Number(m[1]));
  }
  return [...indices]
    .sort((a, b) => a - b)
    .map((index) => ({
      index,
      dbId: String(formData.get(`actor_db_id_${index}`) ?? "").trim() || null,
      name: String(formData.get(`actor_name_${index}`) ?? "").trim(),
      role_name: String(formData.get(`actor_role_${index}`) ?? "").trim(),
      one_liner: String(formData.get(`actor_oneliner_${index}`) ?? "").trim(),
      photo: formData.get(`actor_photo_${index}`),
    }));
}

/**
 * 기존 공연·배우 정보를 수정합니다. 포스터·프로필은 새 파일을 올리면 교체됩니다.
 */
export async function updatePerformanceWithActors(formData: FormData) {
  if (!(await isAdminAuthenticated())) {
    return { ok: false as const, message: "로그인이 필요합니다." };
  }

  try {
    return await runUpdatePerformanceWithActors(formData);
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    console.error("[updatePerformanceWithActors]", e);
    return { ok: false as const, message: msg };
  }
}

async function runUpdatePerformanceWithActors(formData: FormData) {
  const admin = createAdminClient();
  const performanceId = String(formData.get("performance_id") ?? "").trim();
  if (!performanceId) {
    return { ok: false as const, message: "공연 ID가 없습니다." };
  }

  const { data: current, error: curErr } = await admin
    .from("performances")
    .select("id, slug")
    .eq("id", performanceId)
    .maybeSingle();

  if (curErr || !current) {
    return {
      ok: false as const,
      message: curErr?.message ?? "공연을 찾을 수 없습니다.",
    };
  }

  const oldSlug = current.slug as string;
  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description =
    String(formData.get("description") ?? "").trim() || null;
  const period_start = String(formData.get("period_start") ?? "");
  const period_end = String(formData.get("period_end") ?? "");
  const poster = formData.get("poster");
  const entries = collectActorUpdateEntries(formData);

  if (!slug || !title || !period_start || !period_end) {
    return { ok: false as const, message: "슬러그·제목·공연 기간은 필수입니다." };
  }
  if (entries.length === 0) {
    return { ok: false as const, message: "배우를 한 명 이상 두세요." };
  }

  for (const a of entries) {
    if (!a.name) {
      return {
        ok: false as const,
        message: `배우 ${a.index + 1}번 이름을 입력하세요.`,
      };
    }
    if (!a.dbId) {
      const photo = a.photo;
      if (!(photo instanceof File) || photo.size === 0) {
        return {
          ok: false as const,
          message: `새 배우(행 ${a.index + 1})는 프로필 사진이 필요합니다.`,
        };
      }
    }
  }

  if (slug !== oldSlug) {
    const { data: dup } = await admin
      .from("performances")
      .select("id")
      .eq("slug", slug)
      .neq("id", performanceId)
      .maybeSingle();
    if (dup) {
      return {
        ok: false as const,
        message: "이미 사용 중인 슬러그입니다. 다른 값을 입력하세요.",
      };
    }
  }

  let posterUrl: string | null | undefined = undefined;
  if (poster instanceof File && poster.size > 0) {
    const posterPath = `${performanceId}/poster.${extFromFile(poster)}`;
    const { error: upPoster } = await admin.storage
      .from("posters")
      .upload(posterPath, poster, {
        upsert: true,
        contentType: poster.type || "image/jpeg",
      });
    if (upPoster) {
      return {
        ok: false as const,
        message: `포스터 업로드 실패: ${upPoster.message}`,
      };
    }
    const { data: pubPoster } = admin.storage
      .from("posters")
      .getPublicUrl(posterPath);
    posterUrl = pubPoster.publicUrl;
  }

  const perfUpdate: Record<string, unknown> = {
    slug,
    title,
    description,
    period_start,
    period_end,
  };
  if (posterUrl !== undefined) perfUpdate.poster_url = posterUrl;

  const { error: upPerfErr } = await admin
    .from("performances")
    .update(perfUpdate)
    .eq("id", performanceId);

  if (upPerfErr) {
    return {
      ok: false as const,
      message: upPerfErr.message ?? "공연 정보 저장에 실패했습니다.",
    };
  }

  const desiredExisting: string[] = [];
  const newActorIds: string[] = [];

  for (let ord = 0; ord < entries.length; ord++) {
    const a = entries[ord];
    if (a.dbId) {
      const { data: row, error: selErr } = await admin
        .from("actors")
        .select("id, performance_id")
        .eq("id", a.dbId)
        .maybeSingle();
      if (selErr || !row || row.performance_id !== performanceId) {
        return {
          ok: false as const,
          message: "배우 정보가 공연과 일치하지 않습니다. 페이지를 새로고침 하세요.",
        };
      }
      desiredExisting.push(a.dbId);

      const { error: actUpErr } = await admin
        .from("actors")
        .update({
          name: a.name,
          role_name: a.role_name || null,
          one_liner: a.one_liner || null,
          sort_order: ord,
        })
        .eq("id", a.dbId)
        .eq("performance_id", performanceId);

      if (actUpErr) {
        return {
          ok: false as const,
          message: actUpErr.message ?? "배우 정보 저장에 실패했습니다.",
        };
      }

      const photo = a.photo;
      if (photo instanceof File && photo.size > 0) {
        const apath = `${performanceId}/${a.dbId}.${extFromFile(photo)}`;
        const { error: upA } = await admin.storage
          .from("actor-photos")
          .upload(apath, photo, {
            upsert: true,
            contentType: photo.type || "image/jpeg",
          });
        if (upA) {
          return {
            ok: false as const,
            message: `배우 사진 업로드 실패: ${upA.message}`,
          };
        }
        const { data: pubA } = admin.storage
          .from("actor-photos")
          .getPublicUrl(apath);
        await admin
          .from("actors")
          .update({ profile_photo_url: cacheBustedStorageUrl(pubA.publicUrl) })
          .eq("id", a.dbId);
      }
    } else {
      const photo = a.photo as File;
      const { data: actorRow, error: actorErr } = await admin
        .from("actors")
        .insert({
          performance_id: performanceId,
          name: a.name,
          role_name: a.role_name || null,
          one_liner: a.one_liner || null,
          profile_photo_url: null,
          sort_order: ord,
        })
        .select()
        .single();

      if (actorErr || !actorRow) {
        return {
          ok: false as const,
          message: actorErr?.message ?? "새 배우 저장에 실패했습니다.",
        };
      }

      const actorId = actorRow.id as string;
      newActorIds.push(actorId);
      const apath = `${performanceId}/${actorId}.${extFromFile(photo)}`;
      const { error: upA } = await admin.storage
        .from("actor-photos")
        .upload(apath, photo, {
          upsert: true,
          contentType: photo.type || "image/jpeg",
        });
      if (upA) {
        return {
          ok: false as const,
          message: `배우 사진 업로드 실패: ${upA.message}`,
        };
      }
      const { data: pubA } = admin.storage
        .from("actor-photos")
        .getPublicUrl(apath);
      await admin
        .from("actors")
        .update({ profile_photo_url: cacheBustedStorageUrl(pubA.publicUrl) })
        .eq("id", actorId);
    }
  }

  const keptAll = new Set([...desiredExisting, ...newActorIds]);
  const { data: dbActors } = await admin
    .from("actors")
    .select("id")
    .eq("performance_id", performanceId);
  const toDelete =
    dbActors?.filter((row) => !keptAll.has(row.id)).map((row) => row.id) ?? [];
  if (toDelete.length > 0) {
    await admin.from("actors").delete().in("id", toDelete);
  }

  revalidatePath("/");
  revalidatePath("/admin/shows");
  revalidatePath(`/show/${oldSlug}`, "layout");
  if (oldSlug !== slug) {
    revalidatePath(`/show/${slug}`, "layout");
  }

  return { ok: true as const, slug };
}

