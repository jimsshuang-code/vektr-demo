-- ============================================================================
-- VEKTR migration 019_court_media.sql
-- 球場媒體:封面圖 + 影片。
--   - courts.cover_image_url:詳情頁頂部大圖
--   - courts.video_url:介紹影片(YouTube 連結或 mp4 網址)
--   (相簿沿用既有的 courts.photos text[])
-- 冪等。
-- ============================================================================

begin;

alter table courts add column if not exists cover_image_url varchar(500);
alter table courts add column if not exists video_url       varchar(500);

commit;
