const API_URL = 'http://localhost:5002/auth';

async function testAuthMe() {
  let accessToken;

  console.log('🚀 Iniciando prueba de autenticación...\n');

  // Paso 1: Intentar login con usuario de prueba
  console.log('1️⃣ Intentando login con usuario existente...');
  try {
    const loginRes = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@test.com',
        password: '123456'
      })
    });

    if (loginRes.ok) {
      const loginData = await loginRes.json();
      accessToken = loginData.accessToken;
      console.log('✅ Login exitoso!');
      console.log('   Token (primeros 20 chars):', accessToken.substring(0, 20) + '...');
    } else if (loginRes.status === 401) {
      // Usuario no existe, registrar uno nuevo
      console.log('⚠️  Usuario no encontrado, registrando uno nuevo...');
      const registerRes = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
          password: '123456',
          firstName: 'Test',
          lastName: 'User'
        })
      });

      if (registerRes.ok) {
        const registerData = await registerRes.json();
        accessToken = registerData.accessToken;
        console.log('✅ Registro exitoso!');
        console.log('   Token (primeros 20 chars):', accessToken.substring(0, 20) + '...');
      } else {
        const error = await registerRes.json();
        throw new Error(`Registro falló: ${JSON.stringify(error)}`);
      }
    } else {
      const error = await loginRes.json();
      throw new Error(`Login falló: ${JSON.stringify(error)}`);
    }
  } catch (error) {
    console.error('❌ Error durante login/registro:', error.message);
    return;
  }

  // Paso 2: Probar /auth/me con el access token
  console.log('\n2️⃣ Probando endpoint /auth/me...');
  try {
    const meRes = await fetch(`${API_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (meRes.ok) {
      const profile = await meRes.json();
      console.log('✅ /auth/me funciona correctamente!');
      console.log('   Perfil del usuario:');
      console.log(JSON.stringify(profile, null, 2));
    } else {
      const error = await meRes.json();
      throw new Error(`/auth/me falló: ${JSON.stringify(error)}`);
    }
  } catch (error) {
    console.error('❌ Error probando /auth/me:', error.message);
    
    // Intentar decodificar el token para verificar su validez
    console.log('\n🔍 Verificando token...');
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      console.log('   Payload del token:', payload);
      const expiresAt = new Date(payload.exp * 1000);
      console.log('   Expira en:', expiresAt.toLocaleString());
      if (expiresAt < new Date()) {
        console.log('   ⚠️  El token ya expiró!');
      } else {
        console.log('   ✅ El token es válido');
      }
    } catch (e) {
      console.log('   ❌ No se pudo decodificar el token');
    }
  }

  // Paso 3: Probar refresh token (opcional)
  console.log('\n3️⃣ Probando refresh token...');
  try {
    // Primero obtener el refresh token (del registro/login anterior)
    // Nota: En una app real, el refresh token se guarda en el almacenamiento seguro
    console.log('   ℹ️  Para probar el refresh token, necesitas el refreshToken del registro/login');
    console.log('   Puedes modificar este script para usar el refreshToken devuelto por el registro');
  } catch (error) {
    console.error('❌ Error con refresh token:', error.message);
  }

  console.log('\n🏁 Prueba completada.');
}

testAuthMe();
