## Objetivo
Dar acesso admin à sua conta para você abrir `/admin`.

## Passos

1. **Descobrir seu `user_id`**
   - Você me diz qual email usou para logar no app (ex.: `renaldoadvoga@gmail.com` ou outro).
   - Eu consulto `auth.users` no Lovable Cloud para pegar o `id` correspondente.

2. **Inserir role de admin**
   - Executar no banco:
     ```sql
     insert into public.user_roles (user_id, role)
     values ('<seu-user-id>', 'admin')
     on conflict (user_id, role) do nothing;
     ```

3. **Validar acesso**
   - Você faz logout/login no app.
   - Item **ADMIN** aparece no header e a rota `/admin` carrega a lista de usuários.

## Nenhuma alteração de código
Este plano não mexe em arquivos do projeto — é só configuração de dados no Cloud.

## O que preciso de você
Confirme o **email** da conta que deve virar admin.
