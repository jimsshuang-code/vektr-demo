# 推薦碼歸因(Referral Attribution)

> 2026-06-09。完成 Sprint2 發酵邀約的成長迴圈最後一塊:把分享連結帶來的新球友歸因到推薦人。

## 迴圈全貌

1. 球友在約球詳情頁分享(📤 / 📲 用 LINE 揪人)——連結帶 `?ref=<自己的 referral_code>`。
2. 受邀者點連結進 `/match/[id]`,前端把 `ref` 寫入 `vektr_ref` cookie(30 天,既有邏輯)。
3. 受邀者以 LINE 首次登入 → `auth.ts` signIn callback 讀 `vektr_ref` → 呼叫 `bind_referral(新球友 id, ref)`。

## 綁定規則(`007_referral.sql`)

- `users.referred_by`(FK → users.id)記錄推薦人。
- `bind_referral(p_user_id, p_ref_code)`(SECURITY DEFINER):
  - 只在 `referred_by IS NULL` 時綁定(**first-touch wins**),可重複呼叫安全(回 false)。
  - 找不到推薦人或自我推薦 → 不綁定。
- signIn callback 為 **fail-open**:歸因任何失敗都不影響登入;綁定成功後清 `vektr_ref` cookie。

## 部署待辦

```
export PATH="$(brew --prefix libpq)/bin:$PATH"
export DIRECT_URL=$(grep -E '^DIRECT_URL=' .env.local | sed -E 's/^[^=]+=//; s/^"//; s/"$//')
psql "$DIRECT_URL" -f 007_referral.sql
```
回 `ALTER TABLE` / `CREATE FUNCTION` / `COMMIT`。然後 commit + push + `vercel --prod`。

## 驗證 / 報表

- 綁定:用 A 帳號的 ref 連結邀 B,B 以 LINE 登入後,`select referred_by from users where id=<B>` 應為 A。
- 成長報表(之後可加後台頁):
  ```sql
  select referred_by, count(*) AS invited
    from users where referred_by is not null
   group by referred_by order by invited desc;
  ```

## 注意 / 後續

- MVP 採 first-touch 且 `referred_by IS NULL` 即可綁定;若日後要做**推薦獎勵**(發錢/點數),須收緊為「僅限註冊當下綁定」(可讓 `upsert_line_user` 回傳是否新建,或檢查 created_at),並加防濫用(同裝置/IP、上限)。
- 球友端尚未顯示「我推薦了幾人」(P2 後續)。

## 後台成長報表(已做)

- `008_referral_admin.sql` — `admin_referral_stats` / `admin_referral_summary`(SECURITY DEFINER + assert_admin)。
- `app/lib/referralsDb.ts` + `app/admin/referrals/page.tsx`(server component,`requireAdmin('members',{write})` → super_admin/admin)。
- Admin 側欄新增「推薦成長」連結。顯示總計卡(已歸因球友 / 有效推薦人)+ 推薦排行榜(上限 500)。
- 部署需套用 `007_referral.sql` 與 `008_referral_admin.sql`。
