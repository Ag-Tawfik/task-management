<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Keep this migration DBAL-free by using raw SQL for MySQL.
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE tasks MODIFY description TEXT NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE tasks MODIFY description TEXT NOT NULL');
        }
    }
};

