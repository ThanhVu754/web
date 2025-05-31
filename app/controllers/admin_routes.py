from flask import Blueprint, render_template

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/dashboard')
def dashboard():
    return render_template('admin/dashboard.html')

@admin_bp.route('/login')
def login_admin():
    return render_template('admin/login_admin.html')
