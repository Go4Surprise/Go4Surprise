from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import StaleElementReferenceException
import unittest, time

class AppDynamicsJob(unittest.TestCase):
    def setUp(self):
        chrome_options = Options()
        chrome_options.add_argument("--start-maximized")
        service = Service(r"C:\Webdriver\chromedriver-win64\chromedriver.exe")
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.wait = WebDriverWait(self.driver, 30)

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

    def click_with_retry(self, by, value):
        for _ in range(3):
            try:
                element = self.wait.until(EC.element_to_be_clickable((by, value)))
                self.driver.execute_script("arguments[0].click();", element)
                return
            except StaleElementReferenceException:
                time.sleep(1)

    def test_app_dynamics_job(self):
        driver = self.driver
        wait = self.wait

        # Login
        driver.get("http://localhost:8081/LoginScreen")
        self.fill_field_safe(By.XPATH, "//input[@placeholder='Nombre de usuario']", "Paula10")
        self.fill_field_safe(By.XPATH, "//input[@placeholder='Contraseña']", "prueba1234")
        self.click_with_retry(By.XPATH, "//*[contains(text(),'Iniciar sesión')]")
        time.sleep(2)

        # Ir al perfil
        driver.get("http://localhost:8081/Profile")
        self.click_with_retry(By.XPATH, "//*[contains(text(),'Editar Perfil')]")

        # Rellenar campos
        self.fill_field_safe(By.XPATH, "(//input)[1]", "paula")       # Nombre
        self.fill_field_safe(By.XPATH, "(//input)[2]", "Sanchez")     # Apellido
        self.fill_field_safe(By.XPATH, "(//input)[3]", "paula10")     # Usuario

        # Fecha
        birth_input = wait.until(EC.presence_of_element_located((By.XPATH, "(//input)[6]")))
        driver.execute_script("""
            const input = arguments[0];
            const setValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setValue.call(input, arguments[1]);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        """, birth_input, "2004-01-14")

        # Guardar cambios
        self.click_with_retry(By.XPATH, "//*[contains(text(),'Guardar')]")

        # Esperar un poco para que se guarde y cerrar navegador
        time.sleep(3)

    def tearDown(self):
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()
