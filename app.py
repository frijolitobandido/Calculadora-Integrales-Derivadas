from flask import Flask, render_template, request, jsonify
import sympy as sp
import matplotlib
matplotlib.use('Agg')  # Evita errores de entorno gráfico
import matplotlib.pyplot as plt
from io import BytesIO
import base64
import numpy as np

app = Flask(__name__)

# ----------------- Página principal: Integrales -----------------
@app.route('/')
@app.route('/integrales')
def index_integrales():
    return render_template('integrales/index.html')

# ----------------- Página de Derivadas -----------------
@app.route('/derivadas')
def index_derivadas():
    return render_template('derivadas/derivadas.html')

# ----------------- Ruta para cálculo de derivadas -----------------
@app.route('/derivar', methods=['POST'])
def derivar():
    data = request.get_json()
    funcion = data.get('funcion', '')

    try:
        x = sp.symbols('x')
        f = sp.sympify(funcion)
        f_deriv = sp.diff(f, x)

        # Convertir funciones simbólicas a funciones numéricas
        f_lamb = sp.lambdify(x, f, 'numpy')
        f_deriv_lamb = sp.lambdify(x, f_deriv, 'numpy')

        xs = np.linspace(-10, 10, 400)
        ys_f = np.array([f_lamb(val) for val in xs], dtype=float)
        ys_deriv = np.array([f_deriv_lamb(val) for val in xs], dtype=float)

        # Configuración del gráfico
        plt.style.use('dark_background')
        fig, ax = plt.subplots(figsize=(6, 4))
        fig.patch.set_facecolor('#1e1e2f')
        ax.set_facecolor('#1e1e2f')

        ax.plot(xs, ys_f, label='f(x)', color='#00bfff', linewidth=2)
        ax.plot(xs, ys_deriv, label="f'(x)", color='#00ffcc', linestyle='--', linewidth=2)
        ax.legend(facecolor='#2c2c3c', edgecolor='#00bfff', labelcolor='white')
        ax.grid(True, color='#00bfff', alpha=0.3)
        ax.set_xlabel('x', color='white')
        ax.set_ylabel('y', color='white')
        ax.tick_params(colors='white')

        # Convertir gráfico a base64
        buf = BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', facecolor=fig.get_facecolor())
        buf.seek(0)
        grafico_base64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)

        return jsonify({
            'funcion': str(f),
            'derivada': str(f_deriv),
            'grafico': grafico_base64
        })

    except Exception as e:
        return jsonify({'error': str(e)})


# ----------------- Ejecución del servidor -----------------
if __name__ == '__main__':
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)