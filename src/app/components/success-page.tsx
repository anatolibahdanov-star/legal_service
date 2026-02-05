import { CheckCircle, Mail, ArrowLeft } from "lucide-react";

export function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 lg:p-12">
        <div className="text-center">
          {/* Иконка успеха */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          {/* Заголовок */}
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Спасибо за обращение!
          </h1>

          {/* Описание */}
          <p className="text-lg text-gray-600 mb-8">
            Ваш вопрос успешно отправлен нашим юристам
          </p>

          {/* Информационные блоки */}
          <div className="space-y-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 mb-2">Что дальше?</h3>
                  <p className="text-sm text-gray-700">
                    Наши специалисты изучат ваш вопрос и подготовят детальный ответ. 
                    Вы получите консультацию на указанный email в течение 24 часов.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 mb-2">Проверьте почту</h3>
                  <p className="text-sm text-gray-700">
                    Мы отправили вам письмо с подтверждением получения вашего обращения. 
                    Если письмо не пришло, проверьте папку "Спам".
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Дополнительная информация */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-8 text-white">
            <h3 className="font-bold mb-3">Срочная консультация?</h3>
            <p className="text-sm mb-4">
              Если ваш вопрос требует немедленного решения, позвоните нам по телефону:
            </p>
            <a 
              href="tel:+79991234567" 
              className="inline-block bg-white text-blue-600 font-bold py-3 px-6 rounded-lg hover:bg-blue-50 transition-colors"
            >
              +7 (999) 123-45-67
            </a>
          </div>

          {/* Кнопка возврата */}
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Вернуться на главную
          </a>

          {/* Статистика */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">Нам доверяют тысячи клиентов</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">5000+</div>
                <div className="text-xs text-gray-600">Успешных дел</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">10+</div>
                <div className="text-xs text-gray-600">Лет опыта</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">98%</div>
                <div className="text-xs text-gray-600">Довольных клиентов</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
