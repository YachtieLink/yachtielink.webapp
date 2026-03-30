-- Fix sort order: exact name matches must always rank first
-- Problem: "TS Eclipse Star 3" (base_sim=0.89 + builder_boost=0.2 + length_boost=0.15 = 1.24)
-- was outranking "TS Eclipse Star" (base_sim=1.0, no boosts = 1.0)
-- Fix: sort by base_sim first (name match quality), then boosted sim as tiebreaker

CREATE OR REPLACE FUNCTION public.search_yachts(
  p_query text,
  p_builder text default null,
  p_length_min numeric default null,
  p_length_max numeric default null,
  p_limit int default 10
)
RETURNS TABLE (
  id               uuid,
  name             text,
  yacht_type       text,
  length_meters    numeric,
  flag_state       text,
  builder          text,
  cover_photo_url  text,
  crew_count       bigint,
  current_crew_count bigint,
  sim              real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q_norm text := lower(trim(p_query));
  safe_limit int := least(p_limit, 50);
BEGIN
  RETURN QUERY
  WITH prefix_variants(variant) AS (
    VALUES
      (q_norm),
      ('m/y ' || q_norm),
      ('s/y ' || q_norm),
      ('my ' || q_norm),
      ('sy ' || q_norm),
      ('mv ' || q_norm),
      ('fv ' || q_norm)
  ),
  base_scores AS (
    SELECT
      y.id,
      y.name,
      y.yacht_type,
      y.length_meters,
      y.flag_state,
      y.builder,
      y.cover_photo_url,
      greatest(
        similarity(y.name_normalized, q_norm),
        (SELECT coalesce(max(similarity(y.name_normalized, pv.variant)), 0) FROM prefix_variants pv)
      ) AS base_sim
    FROM yachts y
    WHERE
      y.name_normalized % q_norm
      OR y.name_normalized ilike '%' || q_norm || '%'
      OR EXISTS (
        SELECT 1 FROM prefix_variants pv
        WHERE y.name_normalized % pv.variant
           OR y.name_normalized ilike '%' || pv.variant || '%'
      )
  )
  SELECT
    bs.id,
    bs.name,
    bs.yacht_type,
    bs.length_meters,
    bs.flag_state,
    bs.builder,
    bs.cover_photo_url,
    (SELECT count(DISTINCT a.user_id)
     FROM attachments a
     WHERE a.yacht_id = bs.id AND a.deleted_at IS NULL
    ) AS crew_count,
    (SELECT count(DISTINCT a.user_id)
     FROM attachments a
     WHERE a.yacht_id = bs.id AND a.deleted_at IS NULL AND a.ended_at IS NULL
    ) AS current_crew_count,
    -- Return boosted sim for classification (green >= 0.8, amber >= 0.3)
    -- But sort by base_sim first so exact name matches always win
    (bs.base_sim
     + CASE
         WHEN p_builder IS NOT NULL
              AND bs.builder IS NOT NULL
              AND lower(trim(bs.builder)) = lower(trim(p_builder))
         THEN 0.2
         ELSE 0
       END
     + CASE
         WHEN p_length_min IS NOT NULL
              AND p_length_max IS NOT NULL
              AND bs.length_meters IS NOT NULL
              AND bs.length_meters BETWEEN p_length_min AND p_length_max
         THEN 0.15
         ELSE 0
       END
    )::real AS sim
  FROM base_scores bs
  WHERE bs.base_sim > 0.05
  ORDER BY bs.base_sim DESC, sim DESC, bs.name
  LIMIT safe_limit;
END;
$$;
