import { post_job } from './model.js'; // تأكد من استيراد الدالة المناسبة من model.js
import { add_log, get_logs, clear_logs } from "./indexeddb_logs.js";

document.addEventListener('DOMContentLoaded', () => {
    alert("finished loading");
    // الحصول على الاستمارة من DOM
    const post_job_form = document.getElementById("post_job_form");
    if (!post_job_form) return;

    post_job_form.addEventListener('submit', async (event) => {
        event.preventDefault(); // لمنع إرسال الاستمارة بشكل افتراضي

        // الحصول على القيم من الحقول في الاستمارة
        const title = document.getElementById("title").value;
        const description = document.getElementById("details").value;
        const budget = document.getElementById("budget").value;

        // التحقق من صحة البيانات
        if (!title || !description || !budget) {
            alert("يرجى ملء جميع الحقول.");
            return;
        }

        try {
            // نشر الوظيفة في قاعدة البيانات
            await post_job(title, description, budget);
            alert("تم نشر الوظيفة بنجاح!");

            // إعادة توجيه المستخدم إلى صفحة "عرض العروض"
            window.location.href = 'client_view_offers.html';
        } catch (error) {
            console.error("حدث خطأ أثناء نشر الوظيفة: ", error);
            alert("حدث خطأ أثناء نشر الوظيفة.");
        }
    });

});