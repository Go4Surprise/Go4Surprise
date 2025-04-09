# -*- coding: utf-8 -*-
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, NoAlertPresentException, StaleElementReferenceException
from selenium.webdriver.common.keys import Keys
import unittest, time

class AppDynamicsJob(unittest.TestCase):
    def setUp(self):
        chrome_options = Options()
        chrome_options.add_argument("--start-maximized")
        service = Service(r"C:\Webdriver\chromedriver-win64\chromedriver.exe")  # Ajusta si tu ruta es distinta
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.wait = WebDriverWait(self.driver, 20)
        self.verificationErrors = []
        self.accept_next_alert = True

    def fill_field_safe(self, by, value, text):
        for _ in range(3):
            try:
                element = self.wait.until(EC.visibility_of_element_located((by, value)))
                element.click()
                element.clear()
                element.send_keys(text)
                return
            except StaleElementReferenceException:
                time.sleep(1)

    def test_app_dynamics_job(self):
        driver = self.driver
        wait = self.wait

        driver.get("http://localhost:8081/RegisterScreen")

        self.fill_field_safe(By.XPATH, "//input[@placeholder='Nombre de usuario']", "PruebaSL")
        self.fill_field_safe(By.XPATH, "//input[@placeholder='Contraseña']", "PRUEBA1234")
        self.fill_field_safe(By.XPATH, "//input[@placeholder='Confirmar Contraseña']", "PRUEBA1234")
        self.fill_field_safe(By.XPATH, "//input[@placeholder='Nombre']", "prueba")
        self.fill_field_safe(By.XPATH, "//input[@placeholder='Apellido']", "pruebas")
        self.fill_field_safe(By.XPATH, "//input[@placeholder='Correo electrónico']", "virginiamesa10@gmail.com")
        self.fill_field_safe(By.XPATH, "//input[@placeholder='Teléfono']", "688208108")

        birthdate_input = wait.until(EC.presence_of_element_located((By.NAME, "birthdate")))
        driver.execute_script("""
            const dateInput = arguments[0];
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeInputValueSetter.call(dateInput, '2003-02-26');
            dateInput.dispatchEvent(new Event('input', { bubbles: true }));
            dateInput.dispatchEvent(new Event('change', { bubbles: true }));
        """, birthdate_input)

        # Click en checkbox
        # Aceptar términos (click en checkbox real)
        checkbox = wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@type='checkbox']")))
        checkbox.click()


        # Click en “Registrarse”
        boton_registro = wait.until(EC.element_to_be_clickable((By.XPATH, "//Text[contains(text(),'Registrarse')]/..")))
        driver.execute_script("arguments[0].click();", boton_registro)

        # Esperar redirección o notificación
        time.sleep(5)

        # ✅ Validación de redirección
        current_url = driver.current_url
        print("🔗 URL actual:", current_url)
        self.assertIn("LoginScreen", current_url, "❌ No se redirigió correctamente al LoginScreen. Registro fallido.")

    def is_element_present(self, how, what):
        try:
            self.driver.find_element(by=how, value=what)
        except NoSuchElementException:
            return False
        return True

    def is_alert_present(self):
        try:
            self.driver.switch_to.alert
        except NoAlertPresentException:
            return False
        return True

    def close_alert_and_get_its_text(self):
        try:
            alert = self.driver.switch_to.alert
            alert_text = alert.text
            if self.accept_next_alert:
                alert.accept()
            else:
                alert.dismiss()
            return alert_text
        finally:
            self.accept_next_alert = True

    def tearDown(self):
        self.driver.quit()
        self.assertEqual([], self.verificationErrors)

if __name__ == "__main__":
    unittest.main()
