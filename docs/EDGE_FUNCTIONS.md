## Supabase Edge Functions (School Tracking)

### Fonksiyonlar
- **`session-start`**: Öğretmenin oturum başlatması (SaaS şeması).
- **`session-qr`**: Aktif oturum için kısa ömürlü, PII içermeyen QR token üretimi.
- **`attendance-checkin`**: Öğrencinin token ile check-in olması (tek kullanımlık, konum kontrolü destekli).
- **`prototype-teacher-scan`**: Mevcut prototip şeması için “teacher scans student QR” akışını backend’e taşır.

### Gerekli env değişkenleri
Edge Functions ortamında:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

> Not: Bu repo içinde `.env`’ye service role key koymayın. Sadece Supabase/CI secret olarak yönetin.

### Güvenlik notları
- Token payload’ı PII içermez; yalnızca random `jti` (`token`) döner.\n- Tek kullanımlık kullanım `qr_tokens.used_at` ile enforce edilir.\n- Location kontrolü: kampüs lat/lon + radius üzerinden uygulanır.\n- Finalize sonrası session mutasyonları DB trigger ile engellenir (`0002_saas_rls_audit.sql`).\n+
