## School Tracking SaaS Roadmap (MVP → v2 → v3 → v4)

Bu doküman, ürün fazlarını **ölçülebilir KPI’lar**, **riskler** ve **başarı kriterleri** ile bağlar. Kod tabanındaki SaaS temel taşları:

- **DB migrations**: `supabase/migrations/0001_init_saas.sql`, `supabase/migrations/0002_saas_rls_audit.sql`
- **Edge Functions**:
  - `supabase/functions/session-start`
  - `supabase/functions/session-qr`
  - `supabase/functions/attendance-checkin`
- **Prototype güvenliğe geçiş köprüsü**:
  - `supabase/functions/prototype-teacher-scan` (client-side scan kararlarını backend’e taşıyan ara çözüm)

### Faz 1 — Professional MVP (çekirdek yoklama)
**Hedef**: Öğretmen ders başında 30–60 sn içinde session başlatabilsin; sınıfın tamamı 1–2 dk içinde check-in yapsın; finalize ile denetlenebilir kayıt oluşsun.

**Kapsam**
- Auth + rol bazlı dashboard yüzeyleri (student/teacher).
- Session lifecycle: start → active/grace → close → finalize.
- Check-in doğrulama: QR token + duplicate + konum (temel geofence).
- Realtime: teacher canlı liste + student durum.
- Audit: finalize ve manuel düzeltme için event üretimi.

**Teknik riskler**
- RLS policy karmaşıklığı ve yanlış erişim.
- Zaman penceresi edge-case’leri (geç başlayan ders, saat dilimi).
- Konum doğrulama (GPS accuracy) yüzünden false negative.

**Başarı kriterleri (KPI)**
- **Session finalized rate**: >= %95 (haftalık derslerde finalize edilmiş oturum oranı)
- **Check-in success**: >= %98 (valid attempt / total attempt)
- **Median check-in latency**: <= 1.5s (student check-in API yanıt süresi)
- **Invalid attempt rate**: <= %2

### Faz 2 — School Admin (operasyon ve yönetim)
**Hedef**: Okul/bolum operasyonu web panel üzerinden sürdürülebilir hale gelsin.

**Kapsam**
- Web Admin Panel (v2): users/roles, course+timetable, geofence, policies.
- Import: CSV (students, timetable), doğrulama & dedup.
- Correction workflow: request → review → approve/reject.
- Bildirimler: in-app + push + opsiyonel email.
- Raporlar: öğrenci/ders/öğretmen bazlı export.

**Teknik riskler**
- Import veri kalitesi ve çakışmalar.
- Bildirim teslim garantisi (push token lifecycle).

**Başarı kriterleri (KPI)**
- **Admin ops time**: %30 azalma (manuel işlem süresi)
- **Correction SLA**: 48 saat içinde kararlanan istek oranı >= %90
- **Report generation**: 5sn altında >= %95 (ortalama rapor üretim süresi)

### Faz 3 — Security & Scale (fraud dayanıklılığı + multi-tenant olgunluğu)
**Hedef**: Fraud ve abuse durumlarında sistemin hem güvenli hem kullanılabilir kalması.

**Kapsam**
- Device binding / device sessions (tek cihaz politikası opsiyonel).
- Adaptive rate limits + suspicious attempt log.
- Advanced RLS test suite + migration review gate.
- Monitoring + alerting + incident playbook.

**Teknik riskler**
- False positive güvenlik kuralları (UX’i bozar).
- Tenant izolasyonunda yanlış konfigürasyon.

**Başarı kriterleri (KPI)**
- **Replay/duplicate blocked**: artış (bloklanan abuse olayları) + düşük false positive
- **Security incident MTTR**: < 1 iş günü

### Faz 4 — Advanced (entegrasyon + akıllı içgörü)
**Hedef**: Okul sistemleriyle entegrasyon ve proaktif risk analitiği.

**Kapsam**
- SIS/ERP entegrasyonları (import + sync).
- Risk skorlaması / anomali tespiti.
- Kiosk/NFC opsiyonları.

**Başarı kriterleri (KPI)**
- **Early risk detection precision** (pilotlarda)
- **Operational adoption**: aktif kullanıcı retention.

